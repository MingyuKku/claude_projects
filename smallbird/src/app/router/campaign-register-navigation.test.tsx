import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  createCampaignDraft,
  fetchCampaign,
  payCampaign,
  saveCampaignDraft,
  testReviewCampaign,
} from "@/entities/campaign";
import { serverApi, serverApiV3 } from "@/shared/api";
import { ROUTES } from "@/shared/config";

import {
  mockSession,
  mockV3Get,
  renderRoute,
  resetSession,
} from "./test-utils";

import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApi: { get: vi.fn(), post: vi.fn() },
  serverApiV3: { get: vi.fn(), put: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

// Radix(사이드바 드로어·알럿)가 쓰는 브라우저 API가 jsdom에 없어 이 파일에서만 채움.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const session = {
  result: true,
  userIdx: 1,
  accountIdx: 2,
  threadUserIdx: 3,
  authority: "MASTER",
  service: "client",
  nickname: "테스트",
  identifier: "tester",
  email: "test@example.com",
};

beforeEach(() => {
  window.sessionStorage.clear();
  resetSession(session);
  vi.mocked(serverApi.post)
    .mockReset()
    .mockResolvedValue({ result: true, authority: "MASTER", userIdx: 1 });
  mockV3Get(() => Promise.reject(new Error("unmocked")));
});

const search = (router: Awaited<ReturnType<typeof renderRoute>>) =>
  `${router.state.location.pathname}${router.state.location.search}`;

describe("캠페인 등록 내역 경로", () => {
  async function createPaidCampaign() {
    const draft = await createCampaignDraft({
      serviceType: "PICK",
      productType: "BRAND",
    });
    await saveCampaignDraft({
      ...draft,
      // 기자단형은 2단계에 입력할 것이 없어 수정 모드에서 바로 "다음"을 누를 수 있음.
      campaignInfo: { ...draft.campaignInfo, campaignType: "PRESS" },
      policy: {
        agreements: {
          service: true,
          privacy: true,
          operation: true,
          reward: true,
        },
      },
    });
    await payCampaign(draft.campaignIdx, 0);
    return draft;
  }

  it("결제한 캠페인은 기본 정보 화면에 섹션 8개와 사이드바를 보인다", async () => {
    const draft = await createPaidCampaign();

    await renderRoute(`/campaign/${draft.campaignIdx}`);

    expect(
      await screen.findByRole("heading", { level: 2, name: "기본 정보" }),
    ).toBeInTheDocument();
    // 승인 상태 배너 제목 1개 + 섹션 제목 8개.
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(9);
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "현재 캠페인은 승인 검토중입니다.",
      }),
    ).toBeInTheDocument();
    const sidebar = screen.getByRole("navigation", {
      name: "캠페인 등록 단계",
    });
    expect(
      within(sidebar).getByRole("button", { name: "기본정보" }),
    ).toHaveAttribute("aria-current", "step");
  });

  it("검토중에서 승인 요청을 취소하면 환불 알럿을 거쳐 작성 화면 8단계로 이동한다", async () => {
    const draft = await createPaidCampaign();
    const user = userEvent.setup();

    const router = await renderRoute(`/campaign/${draft.campaignIdx}`);

    await user.click(
      await screen.findByRole("button", { name: "승인 요청 취소" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "승인 요청 취소하기" }),
    );

    await screen.findByRole("heading", { level: 2, name: "결제" });
    expect(search(router)).toBe(
      `/campaign/register/${draft.campaignIdx}?step=payment`,
    );
  });

  it("반려되면 사유가 보이고 재승인 요청을 하면 재승인 검토중이 된다", async () => {
    const draft = await createPaidCampaign();
    await testReviewCampaign(draft.campaignIdx, {
      result: "REJECT",
      rejections: [{ section: "INTRO", reason: "설명을 보완해주세요." }],
    });
    const user = userEvent.setup();

    await renderRoute(`/campaign/${draft.campaignIdx}`);

    expect(await screen.findByText("설명을 보완해주세요.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "재승인 요청" }));
    await user.click(await screen.findByRole("button", { name: "확인" }));

    expect(
      await screen.findByRole("heading", {
        name: "현재 캠페인은 재승인 검토중입니다.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "재승인 요청" }),
    ).not.toBeInTheDocument();
  });

  async function createRejectedCampaign(
    sections: ("CAMPAIGN_INFO" | "PRODUCT" | "ADD_ONS" | "INTRO")[],
  ) {
    const draft = await createPaidCampaign();
    await testReviewCampaign(draft.campaignIdx, {
      result: "REJECT",
      rejections: sections.map((section) => ({
        section,
        reason: `${section} 반려 사유`,
      })),
    });
    return draft;
  }

  it("반려된 섹션 중 고칠 수 있는 곳에만 수정 버튼이 있고 잠긴 섹션은 사유만 보인다", async () => {
    const draft = await createRejectedCampaign(["PRODUCT", "ADD_ONS"]);

    await renderRoute(`/campaign/${draft.campaignIdx}`);

    expect(await screen.findByText("ADD_ONS 반려 사유")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "수정" })).toHaveLength(1);
  });

  it("수정을 누르면 해당 단계가 수정 모드로 열리고, 다음은 저장한 뒤 등록 내역으로 돌아간다", async () => {
    const draft = await createRejectedCampaign(["PRODUCT"]);
    const user = userEvent.setup();

    const router = await renderRoute(`/campaign/${draft.campaignIdx}`);
    await user.click(await screen.findByRole("button", { name: "수정" }));

    await screen.findByRole("heading", { level: 2, name: "제품 정보 입력" });
    expect(search(router)).toBe(
      `/campaign/register/${draft.campaignIdx}?step=product`,
    );
    // 수정 모드: 사이드바 맨 위 "기본정보", 하단 바는 "다음"만.
    const sidebar = screen.getByRole("navigation", {
      name: "캠페인 등록 단계",
    });
    expect(
      within(sidebar).getByRole("button", { name: "기본정보" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "임시저장" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "이전" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "결제하기" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "다음" }));

    await screen.findByRole("heading", { level: 2, name: "기본 정보" });
    expect(search(router)).toBe(`/campaign/${draft.campaignIdx}`);
  });

  it("수정 모드 사이드바의 기본정보를 누르면 저장한 뒤 등록 내역으로 돌아간다", async () => {
    const draft = await createRejectedCampaign(["INTRO"]);
    const user = userEvent.setup();

    const router = await renderRoute(
      `/campaign/register/${draft.campaignIdx}?step=intro`,
    );
    const sidebar = await screen.findByRole("navigation", {
      name: "캠페인 등록 단계",
    });
    await user.click(within(sidebar).getByRole("button", { name: "기본정보" }));

    await screen.findByRole("heading", { level: 2, name: "기본 정보" });
    expect(search(router)).toBe(`/campaign/${draft.campaignIdx}`);
  });

  it("수정 모드에서 부가서비스·정책 동의·결제 단계는 읽기 전용이고 안내가 붙는다", async () => {
    const draft = await createRejectedCampaign(["PRODUCT"]);

    await renderRoute(`/campaign/register/${draft.campaignIdx}?step=add-ons`);
    expect(
      await screen.findByText(
        "결제 금액에 영향을 주는 값이라 수정할 수 없습니다.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /AI 포스팅 가이드/ }),
    ).toBeDisabled();
  });

  it.each(["policy", "payment"])(
    "수정 모드의 %s 단계는 입력이 막히고 이미 동의·결제한 내용이라는 안내가 붙는다",
    async (step) => {
      const draft = await createRejectedCampaign(["PRODUCT"]);

      await renderRoute(`/campaign/register/${draft.campaignIdx}?step=${step}`);

      expect(
        await screen.findByText(
          "이미 동의·결제를 마친 내용이라 수정할 수 없습니다.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("checkbox", { name: "약관 전체 동의" }),
      ).toBeDisabled();
    },
  );

  it("수정 모드에서도 잠기지 않은 단계는 그대로 입력할 수 있다", async () => {
    const draft = await createRejectedCampaign(["INTRO"]);

    await renderRoute(`/campaign/register/${draft.campaignIdx}?step=intro`);

    await screen.findByRole("heading", {
      level: 2,
      name: "캠페인 소개서 작성",
    });
    expect(
      screen.queryByText("결제 금액에 영향을 주는 값이라 수정할 수 없습니다."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /직접 작성하기/ })).toBeEnabled();
  });

  it("등록 중인 캠페인은 작성 화면으로 보낸다", async () => {
    const draft = await createCampaignDraft({
      serviceType: "PICK",
      productType: "BRAND",
    });

    const router = await renderRoute(`/campaign/${draft.campaignIdx}`);

    await screen.findByRole("heading", { level: 2, name: "캠페인 정보 입력" });
    expect(search(router)).toBe(
      `/campaign/register/${draft.campaignIdx}?step=campaign-info`,
    );
  });

  it("없는 캠페인은 not-found다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    await renderRoute("/campaign/999");

    expect(
      await screen.findByRole("heading", { name: "페이지를 찾을 수 없습니다" }),
    ).toBeInTheDocument();
  });
});

describe("캠페인 등록 경로", () => {
  it("?type=pick으로 들어오면 캠페인을 만들고 작성 주소로 교체해 1단계를 연다", async () => {
    const router = await renderRoute(`${ROUTES.campaignRegister}?type=pick`);

    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "캠페인 정보 입력",
      }),
    ).toBeInTheDocument();
    expect(search(router)).toBe("/campaign/register/1001?step=campaign-info");
    // 새 주소로 바꾼 것이라 뒤로 가도 만들기 주소가 남지 않는다.
    expect(router.state.historyAction).toBe("REPLACE");
    expect(
      screen.getByRole("heading", { level: 1, name: "캠페인 등록" }),
    ).toBeInTheDocument();
  });

  it("?type=recruit도 5단계 이름이 캠페인 소개서 작성이다", async () => {
    await renderRoute(`${ROUTES.campaignRegister}?type=recruit`);

    const sidebar = await screen.findByRole("navigation", {
      name: "캠페인 등록 단계",
    });
    expect(
      within(sidebar).getByRole("button", { name: /캠페인 소개서 작성/ }),
    ).toBeInTheDocument();
    expect(within(sidebar).queryByText("모집동의서 작성")).toBeNull();
  });

  it.each(["", "?type=group", "?type=PICK"])(
    "type이 없거나 잘못되면(%s) not-found다",
    async (query) => {
      vi.spyOn(console, "error").mockImplementation(() => {});

      await renderRoute(`${ROUTES.campaignRegister}${query}`);

      expect(
        await screen.findByRole("heading", {
          name: "페이지를 찾을 수 없습니다",
        }),
      ).toBeInTheDocument();
    },
  );

  it("없는 캠페인과 숫자가 아닌 id는 not-found다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    await renderRoute("/campaign/register/999?step=product");
    expect(
      await screen.findByRole("heading", { name: "페이지를 찾을 수 없습니다" }),
    ).toBeInTheDocument();
  });

  it("step이 없거나 잘못되면 아직 완료하지 않은 첫 단계로 바로잡는다", async () => {
    const draft = await createCampaignDraft({
      serviceType: "PICK",
      productType: "BRAND",
    });

    const router = await renderRoute(
      `/campaign/register/${draft.campaignIdx}?step=bogus`,
    );

    await screen.findByRole("heading", { level: 2, name: "캠페인 정보 입력" });
    expect(search(router)).toBe(
      `/campaign/register/${draft.campaignIdx}?step=campaign-info`,
    );
  });

  it("결제창에서 돌아오면(?isPaid=true) 8단계로 열어 접수 알럿을 띄우고 결제 서버가 붙인 쿼리를 지운다", async () => {
    const draft = await createCampaignDraft({
      serviceType: "PICK",
      productType: "BRAND",
    });

    const router = await renderRoute(
      `/campaign/register/${draft.campaignIdx}?isPaid=true&gopaymethod=VBank&goodName=x`,
    );

    const alert = await screen.findByRole("alertdialog");
    expect(alert).toHaveTextContent("충전 요청 완료");
    expect(search(router)).toBe(
      `/campaign/register/${draft.campaignIdx}?step=payment`,
    );
    // 알럿이 열려 있으면 뒤 화면은 aria-hidden이라 hidden 포함으로 찾음.
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "결제 수단",
        hidden: true,
      }),
    ).toBeInTheDocument();
  });

  it("결제 실패·취소(?isPaid=false)는 알럿 없이 8단계만 연다", async () => {
    const draft = await createCampaignDraft({
      serviceType: "PICK",
      productType: "BRAND",
    });

    const router = await renderRoute(
      `/campaign/register/${draft.campaignIdx}?isPaid=false&code=USER_CANCELED`,
    );

    await screen.findByRole("heading", { level: 3, name: "결제 수단" });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(search(router)).toBe(
      `/campaign/register/${draft.campaignIdx}?step=payment`,
    );
  });

  it("step을 지정하면 그 단계를 열고 사이드바로 이동하면 주소가 바뀐다", async () => {
    const draft = await createCampaignDraft({
      serviceType: "PICK",
      productType: "BRAND",
    });

    const router = await renderRoute(
      `/campaign/register/${draft.campaignIdx}?step=conditions`,
    );

    expect(
      await screen.findByRole("heading", { level: 2, name: "진행 조건 설정" }),
    ).toBeInTheDocument();
    expect(search(router)).toContain("step=conditions");
  });
});

describe("상태별 진입", () => {
  async function paidCampaign() {
    const draft = await createCampaignDraft({
      serviceType: "PICK",
      productType: "BRAND",
    });
    await saveCampaignDraft({
      ...draft,
      policy: {
        agreements: {
          service: true,
          privacy: true,
          operation: true,
          reward: true,
        },
      },
    });
    await payCampaign(draft.campaignIdx, 0);
    return draft.campaignIdx;
  }

  it("승인 요청 이후 캠페인은 작성 주소로 와도 등록 내역으로 보낸다", async () => {
    const campaignIdx = await paidCampaign();

    const router = await renderRoute(
      `/campaign/register/${campaignIdx}?step=payment`,
    );

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/campaign/${campaignIdx}`),
    );
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it("반려된 캠페인은 step 없이는 등록 내역으로, step이 있으면(수정) 작성 화면으로 연다", async () => {
    const campaignIdx = await paidCampaign();
    await testReviewCampaign(campaignIdx, {
      result: "REJECT",
      rejections: [{ section: "PRODUCT", reason: "확인해주세요." }],
    });

    const detailRouter = await renderRoute(`/campaign/register/${campaignIdx}`);
    await waitFor(() =>
      expect(detailRouter.state.location.pathname).toBe(
        `/campaign/${campaignIdx}`,
      ),
    );
  });

  it("반려 후 수정으로 step이 있으면 작성 화면이 열린다", async () => {
    const campaignIdx = await paidCampaign();
    await testReviewCampaign(campaignIdx, {
      result: "REJECT",
      rejections: [{ section: "PRODUCT", reason: "확인해주세요." }],
    });

    const router = await renderRoute(
      `/campaign/register/${campaignIdx}?step=product`,
    );

    expect(
      await screen.findByRole("heading", { level: 2, name: "제품 정보 입력" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(
      `/campaign/register/${campaignIdx}`,
    );
    expect((await fetchCampaign(campaignIdx)).status).toBe("REJECTED");
  });
});

describe("Sub ID", () => {
  it("캠페인 등록 경로에 들어오면 계정 설정으로 보낸다", async () => {
    mockSession({ ...session, authority: "SUB" });
    mockV3Get((path: string) =>
      path.startsWith("/mypage/account")
        ? Promise.resolve({ result: false, reason: "error" })
        : Promise.reject(new Error("unmocked")),
    );
    vi.mocked(serverApiV3.get).mockClear();

    const router = await renderRoute(`${ROUTES.campaignRegister}?type=pick`);

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ROUTES.mypageAccount),
    );
  });
});
