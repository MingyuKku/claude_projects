import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { createCampaign, fetchCampaignDetail } from "@/entities/campaign";
import { serverApiV3 } from "@/shared/api";
import { ROUTES } from "@/shared/config";

import { mockV3Get, renderRoute, resetSession } from "./test-utils";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  serverApi: { get: vi.fn(), post: vi.fn() },
  serverApiV3: { get: vi.fn(), post: vi.fn() },
}));

const session = {
  result: true,
  userIdx: 1,
  accountIdx: 2,
  threadUserIdx: 3,
  authority: "MASTER",
  service: "client",
  identifier: "tester",
  email: "test@example.com",
};

// 목 저장소 시드(entities/campaign mock/campaign-seeds): 14개, 3 작성 완료 데모 · 6 승인 검토중 · 14 모집형 등록 중
const SEED_COUNT = 14;

function readMockCampaignCount() {
  const raw = window.sessionStorage.getItem("bigbird:mock:campaign-db");
  const db = JSON.parse(raw ?? "{}") as { campaigns?: unknown[] };
  return db.campaigns?.length ?? 0;
}

// 1단계(기본 정보)를 마친 PICK 캠페인을 목 저장소에 만듦. 결제 단계 등 1단계 뒤 단계는 이 상태여야 열림.
async function createInfoCompleteCampaign(name: string, status?: string) {
  const { campaignIdx } = await createCampaign({
    serviceType: "PICK",
    productType: "BRAND",
    demo: false,
  });
  const key = "bigbird:mock:campaign-db";
  const db = JSON.parse(window.sessionStorage.getItem(key) ?? "{}") as {
    campaigns: { campaignIdx: number; status: string; info: object }[];
  };
  const record = db.campaigns.find(
    (campaign) => campaign.campaignIdx === campaignIdx,
  );
  if (!record) throw new Error("mock campaign not found");
  if (status) record.status = status;
  record.info = {
    ...record.info,
    name,
    brandIdx: 1,
    campaignType: "PRODUCT_DELIVERY",
    startDate: "2099-01-01",
  };
  window.sessionStorage.setItem(key, JSON.stringify(db));
  return campaignIdx;
}

beforeEach(() => {
  window.sessionStorage.clear();
  resetSession(session);
});

describe("캠페인 등록 진입", () => {
  it("PICK형으로 들어오면 캠페인을 한 번 만들고 1단계 작성 주소로 바꾼다", async () => {
    const router = await renderRoute(`${ROUTES.campaignRegister}?type=pick`);

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        `${ROUTES.campaignRegister}/${SEED_COUNT + 1}`,
      ),
    );
    expect(router.state.location.search).toBe("?step=campaign-info");
    expect(router.state.historyAction).toBe("REPLACE");
    // 진입 화면과 작성 화면이 각자 제목을 그려 findBy 로 찾은 직후 요소가 교체될 수 있어, 찾기와 검사를 함께 재시도함.
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "캠페인 등록" }),
      ).toBeInTheDocument(),
    );
    expect(readMockCampaignCount()).toBe(SEED_COUNT + 1);
  });

  it("모집형은 준비 중 화면이다", async () => {
    await renderRoute(`${ROUTES.campaignRegister}?type=recruit`);

    expect(
      await screen.findByText("준비 중인 기능입니다."),
    ).toBeInTheDocument();
    expect(readMockCampaignCount()).toBe(0);
  });

  it("type이 없거나 잘못되면 not-found다", async () => {
    await renderRoute(`${ROUTES.campaignRegister}?type=group`);

    expect(
      await screen.findByText("페이지를 찾을 수 없습니다"),
    ).toBeInTheDocument();
  });
});

describe("작성 주소의 상태별 진입", () => {
  it.each([
    ["승인 검토중", 6],
    ["작성을 마친 데모", 3],
  ])("%s 캠페인은 등록 내역 주소로 보낸다", async (_label, campaignIdx) => {
    const router = await renderRoute(
      `${ROUTES.campaignRegister}/${campaignIdx}`,
    );

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/campaign/${campaignIdx}`),
    );
  });

  it("등록 중인 모집형 캠페인은 준비 중 화면이다", async () => {
    await renderRoute(`${ROUTES.campaignRegister}/14`);

    expect(
      await screen.findByText("준비 중인 기능입니다."),
    ).toBeInTheDocument();
  });

  it.each(["9999", "abc"])(
    "없는 캠페인(%s)은 not-found다",
    async (campaignIdx) => {
      await renderRoute(`${ROUTES.campaignRegister}/${campaignIdx}`);

      expect(
        await screen.findByText("페이지를 찾을 수 없습니다"),
      ).toBeInTheDocument();
    },
  );
});

// 단계 잠금·첫 미완 단계·사이드바 상태 규칙은 step-status.test.ts, 저장 대기열은 draft-saver.test.ts가 맡음.
// 여기서는 화면을 떠나는 이동(방문 기록) 하나만 봄. 방문 기록은 원래 E2E 대상이지만 등록 화면은 개발 서버 목에서만 열려
// 빌드로 도는 E2E에서 열 수 없어, API 연결 뒤 E2E로 옮김(스펙 §9).
describe("등록 마법사 골격", () => {
  it("입력을 바꾼 채 앱 안에서 떠나면 먼저 저장하고 한 번만 이동한다", async () => {
    const user = userEvent.setup();
    const { campaignIdx } = await createCampaign({
      serviceType: "PICK",
      productType: "BRAND",
      demo: false,
    });
    const router = await renderRoute([
      ROUTES.campaign,
      `${ROUTES.campaignRegister}/${campaignIdx}?step=campaign-info`,
    ]);
    await user.type(
      await screen.findByRole("textbox", { name: /캠페인명/ }),
      "떠나기 전 저장",
    );

    await router.navigate(-1);

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ROUTES.campaign),
    );
    const { draft } = await fetchCampaignDetail(campaignIdx);
    expect(draft.info.name).toBe("떠나기 전 저장");
  });
});

describe("8단계 충전 복귀", () => {
  it("결제창에서 isPaid=true로 돌아오면 접수 알럿을 띄우고 결제 서버가 붙인 쿼리를 지운 뒤 결제 단계에 남는다", async () => {
    // 결제창으로 떠나기 전처럼 결제 단계를 열 수 있는 캠페인에서 시작함.
    const campaignIdx = await createInfoCompleteCampaign("결제 복귀 캠페인");
    const router = await renderRoute(
      `${ROUTES.campaignRegister}/${campaignIdx}?isPaid=true&gopaymethod=VBank&accountNumber=1234567890`,
    );

    expect(await screen.findByText("충전 요청 완료")).toBeInTheDocument();
    await waitFor(() =>
      expect(router.state.location.search).toBe("?step=payment"),
    );
  });
});

describe("등록 내역 진입", () => {
  it("승인 검토중 캠페인은 배너와 섹션을 보이고 승인 요청 취소를 둔다", async () => {
    await renderRoute("/campaign/6");

    expect(
      await screen.findByText("현재 캠페인은 승인 검토중입니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "승인 요청 취소" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /결제 정보/ }),
    ).toBeInTheDocument();
  });

  it("등록 중(결제 전) 캠페인은 작성 화면으로 보낸다", async () => {
    const { campaignIdx } = await createCampaign({
      serviceType: "PICK",
      productType: "BRAND",
      demo: false,
    });
    const router = await renderRoute(`/campaign/${campaignIdx}`);

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        `${ROUTES.campaignRegister}/${campaignIdx}`,
      ),
    );
  });
});

describe("반려 뒤 수정 모드", () => {
  function createRejectedCampaign() {
    return createInfoCompleteCampaign("반려된 캠페인", "REJECTED");
  }

  /** 모두 입력된 시드 캠페인(PICK형 승인 검토중)을 서버처럼 반려해 동의 기록을 지움. */
  async function rejectFilledCampaign() {
    // 시드는 처음 읽을 때 저장소에 들어가므로 먼저 읽음.
    await fetchCampaignDetail(6);
    const key = "bigbird:mock:campaign-db";
    const db = JSON.parse(window.sessionStorage.getItem(key) ?? "{}") as {
      campaigns: {
        campaignIdx: number;
        status: string;
        policy: object | null;
        rejectReason: string | null;
        intro: { mainImage: object | null; detailMedia: object[] };
      }[];
    };
    const record = db.campaigns.find((campaign) => campaign.campaignIdx === 6);
    if (!record) throw new Error("mock campaign not found");
    record.status = "REJECTED";
    record.policy = null;
    record.rejectReason = "금액 확인";
    // 시드는 소개서 이미지가 없어 작성 완료로 보이지 않으므로 채움.
    const image = {
      attachmentIdx: 1,
      url: "https://example.com/a.png",
      mediaType: "IMAGE",
    };
    record.intro.mainImage = image;
    record.intro.detailMedia = [image];
    window.sessionStorage.setItem(key, JSON.stringify(db));
    return 6;
  }

  it("잠긴 단계는 읽기 전용 안내와 함께 열리고, 하단은 임시저장 없이 이전·다음이다", async () => {
    const user = userEvent.setup();
    const campaignIdx = await createRejectedCampaign();
    const router = await renderRoute(
      `${ROUTES.campaignRegister}/${campaignIdx}?step=add-ons`,
    );

    expect(
      await screen.findByText(
        "결제 금액에 영향을 주는 값이라 수정할 수 없습니다.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /AI 포스팅 가이드/ }),
    ).toBeDisabled();
    expect(screen.queryByRole("button", { name: "임시저장" })).toBeNull();
    expect(screen.getByRole("button", { name: /이전/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /다음/ }));

    await waitFor(() =>
      expect(router.state.location.search).toContain("step=intro"),
    );
  });

  it("7단계는 열려 있어 동의를 다시 받고, 8단계에서 결제 없이 재승인을 요청한다", async () => {
    const user = userEvent.setup();
    const campaignIdx = await rejectFilledCampaign();
    const router = await renderRoute(
      `${ROUTES.campaignRegister}/${campaignIdx}?step=policy`,
    );

    const agreeAll = await screen.findByRole("checkbox", {
      name: "약관 전체 동의",
    });
    expect(agreeAll).toBeEnabled();
    expect(agreeAll).not.toBeChecked();
    await user.click(agreeAll);
    await user.click(screen.getByRole("button", { name: /다음/ }));
    await user.click(
      await screen.findByRole("button", { name: "재승인 요청" }),
    );

    expect(
      await screen.findByText("재승인 요청이 완료되었습니다."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "확인" }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/campaign/${campaignIdx}`),
    );
    const detail = await fetchCampaignDetail(campaignIdx);
    expect(detail.stage).toBe("REVIEWING");
    expect(detail.draft.policy).toEqual({
      service: true,
      privacy: true,
      operation: true,
      reward: true,
    });
  });

  it("동의 없이 8단계에서 재승인을 요청하면 필수 항목 알럿 뒤 7단계로 보낸다", async () => {
    const user = userEvent.setup();
    const campaignIdx = await rejectFilledCampaign();
    const router = await renderRoute(
      `${ROUTES.campaignRegister}/${campaignIdx}?step=payment`,
    );

    await user.click(
      await screen.findByRole("button", { name: "재승인 요청" }),
    );
    await user.click(await screen.findByRole("button", { name: "확인" }));

    await waitFor(() =>
      expect(router.state.location.search).toContain("step=policy"),
    );
    expect((await fetchCampaignDetail(campaignIdx)).stage).toBe("REJECTED");
  });
});

describe("데모 모드", () => {
  it("데모 캠페인은 헤더에 DEMO 뱃지, 본문 맨 위에 데모 안내가 붙는다", async () => {
    const { campaignIdx } = await createCampaign({
      serviceType: "PICK",
      productType: "BRAND",
      demo: true,
    });
    await renderRoute(`${ROUTES.campaignRegister}/${campaignIdx}`);

    expect(
      await screen.findByText(
        "현재 데모 모드로 캠페인을 작성하고 있습니다. 실제 결제 및 승인 요청은 진행되지 않습니다.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("DEMO").length).toBeGreaterThan(0);
  });

  it("작성을 마친 데모의 기본 정보는 상태 배너 대신 데모 안내를 보인다", async () => {
    await renderRoute("/campaign/3");

    expect(
      await screen.findByText("현재 캠페인은 데모 모드로 작성한 캠페인입니다."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /결제 정보/ }),
    ).not.toBeInTheDocument();
  });
});

describe("현황 바로 가기의 구독 만료 안내", () => {
  const subscription = (productType: string) => ({
    id: "s1",
    productType,
    productName: productType,
    startedAt: "2026-11-01",
    endsAt: "2026-12-01",
    amount: 100000,
    paymentMethod: "card",
    isCancelScheduled: false,
  });

  function mockSubscriptions(productTypes: string[]) {
    mockV3Get((path) =>
      path === "/mypage/subscription/subscriptions"
        ? Promise.resolve(productTypes.map(subscription))
        : Promise.reject(new Error("unmocked")),
    );
  }

  // 구독 목록을 요청하고 응답이 화면에 반영될 때까지 기다림(도착 전에는 막지 않아 알럿이 안 뜸).
  async function waitForSubscriptions() {
    await waitFor(() =>
      expect(serverApiV3.get).toHaveBeenCalledWith(
        "/mypage/subscription/subscriptions",
      ),
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  async function clickWriteOnRecruitDraft() {
    const user = userEvent.setup();
    const name = await screen.findByText("비글로우 신제품 런칭 캠페인");
    const card = name.closest("li");
    if (!card) throw new Error("campaign card not found");
    await user.click(within(card).getByRole("button", { name: "작성하기" }));
    return user;
  }

  it("구독이 끝난 서비스의 등록 중 캠페인은 이동하지 않고 구독 안내를 띄운다", async () => {
    mockSubscriptions(["pick"]);
    const router = await renderRoute(`${ROUTES.campaign}?tab=draft`);
    await screen.findByText("비글로우 신제품 런칭 캠페인");
    await waitForSubscriptions();
    const user = await clickWriteOnRecruitDraft();

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("구독이 필요합니다")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(ROUTES.campaign);

    await user.click(within(dialog).getByRole("button", { name: "구독하기" }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ROUTES.mypageSubscribe),
    );
  });

  it("구독 중이면 작성 화면으로 이동한다", async () => {
    mockSubscriptions(["recruit"]);
    const router = await renderRoute(`${ROUTES.campaign}?tab=draft`);
    await screen.findByText("비글로우 신제품 런칭 캠페인");
    await waitForSubscriptions();
    await clickWriteOnRecruitDraft();

    await waitFor(() =>
      expect(router.state.location.pathname).toMatch(
        new RegExp(`^${ROUTES.campaignRegister}/\\d+$`),
      ),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
