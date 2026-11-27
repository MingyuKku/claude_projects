import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  createCampaign,
  fetchCampaignDetail,
  useCampaignStatusReturnStore,
} from "@/entities/campaign";
import { serverApiV3 } from "@/shared/api";
import { ROUTES } from "@/shared/config";

import {
  createDetailResponse,
  createFilledDetailResponse,
} from "./campaign-fixtures";
import { createCampaignServerFake } from "./campaign-server-fake";
import { mockV3Get, renderRoute, resetSession } from "./test-utils";

import type { CampaignServerFake } from "./campaign-server-fake";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  serverApi: { get: vi.fn(), post: vi.fn() },
  serverApiV3: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
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

// 가짜 서버(campaign-server-fake)에 미리 넣어 둔 캠페인: 3 작성 완료 데모 · 6 승인 검토중 · 7 반려(모두 입력) · 14 모집형 등록 중.
// 새로 만드는 캠페인은 15번부터 번호를 받음.
const FIRST_NEW_IDX = 15;
const ALL_AGREED = {
  agreements: { service: true, privacy: true, operation: true, reward: true },
};
const NONE_AGREED = {
  agreements: {
    service: false,
    privacy: false,
    operation: false,
    reward: false,
  },
};

let fake: CampaignServerFake;

// 1단계(기본 정보)를 마친 PICK 캠페인을 만듦. 결제 단계 등 1단계 뒤 단계는 이 상태여야 열림.
function createInfoCompleteCampaign(name: string, status = "DRAFT") {
  return fake.add({
    status,
    info: {
      name,
      brandIdx: 1,
      brandName: "데일리 스튜디오",
      campaignType: "PRODUCT_DELIVERY",
      startDate: "2099-01-01",
    },
  });
}

function subscription(productType: string) {
  return {
    id: "s1",
    productType,
    productName: productType,
    startedAt: "2026-11-01",
    endsAt: "2026-12-01",
    amount: 100000,
    paymentMethod: "card",
    isCancelScheduled: false,
  };
}

function mockSubscriptions(productTypes: string[]) {
  mockV3Get((path, ...rest) =>
    path === "/mypage/subscription/subscriptions"
      ? Promise.resolve(productTypes.map(subscription))
      : fake.get(path, rest[0]),
  );
}

beforeEach(() => {
  useCampaignStatusReturnStore.setState({ search: "", entryKey: null });
  resetSession(session);
  fake = createCampaignServerFake(FIRST_NEW_IDX);
  fake.seed(createFilledDetailResponse(3, { demo: true, demoCompleted: true }));
  fake.seed(
    createFilledDetailResponse(6, {
      status: "REVIEWING",
      policy: ALL_AGREED,
      payment: { paidAmount: 11000, paidAt: "2026-11-16 10:00:00" },
    }),
  );
  fake.seed(
    createFilledDetailResponse(7, {
      status: "REJECTED",
      rejectReason: "금액 확인",
      policy: NONE_AGREED,
    }),
  );
  fake.seed(
    createDetailResponse(14, {
      serviceType: "RECRUIT",
      info: { name: "비글로우 신제품 런칭 캠페인" },
    }),
  );
  mockV3Get(fake.get);
  vi.mocked(serverApiV3.post)
    .mockReset()
    .mockImplementation(fake.post as never);
  vi.mocked(serverApiV3.put)
    .mockReset()
    .mockImplementation(fake.put as never);
  vi.mocked(serverApiV3.delete)
    .mockReset()
    .mockImplementation(fake.delete as never);
});

describe("캠페인 등록 진입", () => {
  it("PICK형으로 들어오면 캠페인을 한 번 만들고 1단계 작성 주소로 바꾼다", async () => {
    const router = await renderRoute(`${ROUTES.campaignRegister}?type=pick`);

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        `${ROUTES.campaignRegister}/${FIRST_NEW_IDX}`,
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
    expect(fake.created()).toEqual([FIRST_NEW_IDX]);
  });

  // 생성 요청을 붙잡아 두고, 돌려주는 함수를 부르면 응답함.
  function holdCreate() {
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    vi.mocked(serverApiV3.post).mockImplementation((async (
      path: string,
      body?: never,
    ) => {
      if (path === "/campaign") await gate;
      return fake.post(path, body);
    }) as never);
    return release;
  }

  async function openPickProducts() {
    mockSubscriptions(["pick"]);
    const router = await renderRoute(`${ROUTES.campaignCreate}?service=pick`);
    const heading = await screen.findByRole("heading", {
      name: "캠페인 상품 선택",
    });
    const section = heading.closest("section");
    if (!section) throw new Error("product section not found");
    return { router, products: within(section) };
  }

  async function waitForCreateRequest() {
    await waitFor(() =>
      expect(serverApiV3.post).toHaveBeenCalledWith(
        "/campaign",
        expect.anything(),
      ),
    );
  }

  it("개설 화면에서 고르면 만드는 동안 개설 화면을 두고, 작성 화면이 열린 뒤 뒤로가기는 개설 화면으로 간다", async () => {
    const user = userEvent.setup();
    const { router, products } = await openPickProducts();
    const release = holdCreate();

    await user.click(products.getByRole("button", { name: /브랜드형/ }));
    await waitForCreateRequest();

    expect(router.state.location.pathname).toBe(ROUTES.campaignCreate);
    expect(
      screen.getByRole("heading", { name: "캠페인 상품 선택" }),
    ).toBeInTheDocument();

    release();
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        `${ROUTES.campaignRegister}/${FIRST_NEW_IDX}`,
      ),
    );
    expect(router.state.location.search).toBe("?step=campaign-info");

    // 진입 주소는 기록에 남지 않음(헤더 "<"가 현황까지의 기록 칸 수에 기대지 않게).
    await router.navigate(-1);
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ROUTES.campaignCreate),
    );
  });

  it("만드는 중에 다른 화면으로 옮기면 작성 화면으로 끌고 오지 않는다", async () => {
    const user = userEvent.setup();
    const { router, products } = await openPickProducts();
    const release = holdCreate();

    await user.click(products.getByRole("button", { name: /브랜드형/ }));
    await waitForCreateRequest();
    await router.navigate(ROUTES.campaign);
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ROUTES.campaign),
    );

    release();
    await waitFor(() => expect(fake.created()).toEqual([FIRST_NEW_IDX]));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(router.state.location.pathname).toBe(ROUTES.campaign);
  });

  it("만드는 동안 다른 상품을 눌러도 한 번만 만든다", async () => {
    const user = userEvent.setup();
    const { router, products } = await openPickProducts();
    const release = holdCreate();

    await user.click(products.getByRole("button", { name: /브랜드형/ }));
    await waitForCreateRequest();
    await user.click(products.getByRole("button", { name: /공구형/ }));

    release();
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        `${ROUTES.campaignRegister}/${FIRST_NEW_IDX}`,
      ),
    );
    expect(fake.created()).toEqual([FIRST_NEW_IDX]);
  });

  it("모집형은 준비 중 화면이다", async () => {
    await renderRoute(`${ROUTES.campaignRegister}?type=recruit`);

    expect(
      await screen.findByText("준비 중인 기능입니다."),
    ).toBeInTheDocument();
    expect(fake.created()).toEqual([]);
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
// 여기서는 화면을 떠나는 이동(방문 기록) 하나만 봄. 방문 기록은 원래 E2E 대상이지만 등록 API가 서버(stage 인증 필요)에 있어
// 빌드로 도는 E2E에서 열 수 없어 가짜 서버로 검증함(스펙 §9).
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
    const campaignIdx = createInfoCompleteCampaign("결제 복귀 캠페인");
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

  it("다른 주소로 보낸 첫 진입은 방문 기록에 남지 않아 뒤로가기가 앞 화면으로 간다", async () => {
    const router = await renderRoute(
      [ROUTES.campaign, `${ROUTES.campaignRegister}/6`],
      { shouldWaitForLoad: false },
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/campaign/6"),
    );

    await router.navigate(-1);

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ROUTES.campaign),
    );
  });

  it("승인 요청을 취소하면 작성 화면이 새 상태를 한 번 읽어, 등록 내역으로 되돌아가지 않고 한 번에 간다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute("/campaign/6");
    await user.click(
      await screen.findByRole("button", { name: "승인 요청 취소" }),
    );
    const dialog = await screen.findByRole("alertdialog");
    let detailReads = 0;
    mockV3Get(async (...args: Parameters<typeof fake.get>) => {
      if (args[0] === "/campaign/6") detailReads += 1;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return fake.get(...args);
    });
    const visited: string[] = [];
    let lastKey = router.state.location.key;
    const unsubscribe = router.subscribe(({ location }) => {
      if (location.key === lastKey) return;
      lastKey = location.key;
      visited.push(location.pathname);
    });

    await user.click(
      within(dialog).getByRole("button", { name: "승인 요청 취소하기" }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        `${ROUTES.campaignRegister}/6`,
      ),
    );
    await new Promise((resolve) => setTimeout(resolve, 200));
    unsubscribe();

    expect(visited).toEqual([`${ROUTES.campaignRegister}/6`]);
    expect(detailReads).toBe(1);
  });
});

describe("반려 뒤 수정 모드", () => {
  function createRejectedCampaign() {
    return createInfoCompleteCampaign("반려된 캠페인", "REJECTED");
  }

  /** 모두 입력된 반려 캠페인. 서버가 반려할 때 정책 동의 기록을 지운 상태. */
  function rejectFilledCampaign() {
    return 7;
  }

  it("잠긴 단계는 읽기 전용 안내와 함께 열리고, 하단은 임시저장 없이 이전·다음이다", async () => {
    const user = userEvent.setup();
    const campaignIdx = createRejectedCampaign();
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
      expect(router.state.location.search).toContain("step=policy"),
    );
  });

  it("7단계는 열려 있어 동의를 다시 받고, 8단계에서 결제 없이 재승인을 요청한다", async () => {
    const user = userEvent.setup();
    const campaignIdx = rejectFilledCampaign();
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
    const campaignIdx = rejectFilledCampaign();
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

  it("등록 내역에서 동의 없이 재승인을 요청하면 기록을 쌓지 않고 7단계로 보낸다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute([ROUTES.campaign, "/campaign/7"]);

    await user.click(
      await screen.findByRole("button", { name: "재승인 요청" }),
    );
    await user.click(await screen.findByRole("button", { name: "확인" }));

    await waitFor(() =>
      expect(router.state.location.search).toContain("step=policy"),
    );
    expect(router.state.historyAction).toBe("REPLACE");
  });
});

describe("단계 이동", () => {
  it("입력을 저장하며 단계를 옮겨도 상세를 다시 읽지 않는다", async () => {
    const user = userEvent.setup();
    const campaignIdx = createInfoCompleteCampaign("저장 이동 확인");
    const router = await renderRoute(
      `${ROUTES.campaignRegister}/${campaignIdx}?step=product`,
    );
    await user.type(
      await screen.findByPlaceholderText("협찬제품명을 입력해 주세요."),
      "저장할 제품",
    );
    const detailPath = `/campaign/${campaignIdx}`;
    const countDetailReads = () =>
      vi
        .mocked(serverApiV3.get)
        .mock.calls.filter(([path]) => path === detailPath).length;
    const readsBefore = countDetailReads();

    await user.click(screen.getByRole("button", { name: /다음/ }));
    await waitFor(() =>
      expect(router.state.location.search).toContain("step=creator"),
    );

    expect(serverApiV3.put).toHaveBeenCalledWith(
      `${detailPath}/product`,
      expect.anything(),
    );
    expect(countDetailReads()).toBe(readsBefore);
  });

  it("단계를 옮겨도 상세를 다시 읽지 않는다", async () => {
    const user = userEvent.setup();
    const campaignIdx = createInfoCompleteCampaign("단계 이동 확인");
    const router = await renderRoute(
      `${ROUTES.campaignRegister}/${campaignIdx}?step=product`,
    );
    await screen.findAllByRole("heading", { name: "협찬 제품 정보 입력" });
    const detailPath = `/campaign/${campaignIdx}`;
    const countDetailReads = () =>
      vi
        .mocked(serverApiV3.get)
        .mock.calls.filter(([path]) => path === detailPath).length;
    const readsBefore = countDetailReads();

    await user.click(screen.getByRole("button", { name: /다음/ }));
    await waitFor(() =>
      expect(router.state.location.search).toContain("step=creator"),
    );

    expect(countDetailReads()).toBe(readsBefore);
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

  it("작성 완료를 확인하면 등록 내역이 새 상태를 한 번 읽어, 작성 화면으로 되돌아가지 않고 한 번에 간다", async () => {
    const user = userEvent.setup();
    fake.seed(
      createFilledDetailResponse(90, { demo: true, policy: ALL_AGREED }),
    );
    const router = await renderRoute(
      `${ROUTES.campaignRegister}/90?step=payment`,
    );
    await user.click(await screen.findByRole("button", { name: "완료" }));
    const dialog = await screen.findByRole("alertdialog");
    // 실제 서버처럼 상세 조회 응답이 늦게 오게 함. 즉시 오면 등록 내역이 그려지기 전에 끝나 낡은 상태를 볼 일이 없음.
    let detailReads = 0;
    mockV3Get(async (...args: Parameters<typeof fake.get>) => {
      if (args[0] === "/campaign/90") detailReads += 1;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return fake.get(...args);
    });
    // 이동 중(loading) 알림도 오므로 주소가 실제로 바뀐 때만 기록함.
    const visited: string[] = [];
    let lastKey = router.state.location.key;
    const unsubscribe = router.subscribe(({ location }) => {
      if (location.key === lastKey) return;
      lastKey = location.key;
      visited.push(location.pathname);
    });

    await user.click(within(dialog).getByRole("button", { name: "확인" }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/campaign/90"),
    );
    await new Promise((resolve) => setTimeout(resolve, 200));
    unsubscribe();

    expect(visited).not.toContain(`${ROUTES.campaignRegister}/90`);
    expect(router.state.location.pathname).toBe("/campaign/90");
    expect(detailReads).toBe(1);
  });
});

describe("등록 화면의 헤더 뒤로가기", () => {
  it("현황이 마지막 탭·검색 쿼리를 기억한다", async () => {
    await renderRoute(`${ROUTES.campaign}?tab=draft&panel=filter`);

    await waitFor(() =>
      expect(useCampaignStatusReturnStore.getState().search).toBe("?tab=draft"),
    );
  });

  it("현황에서 개설 화면을 거쳐 들어왔으면 현황 기록으로 되돌아가 탭·검색 기록을 그대로 연다", async () => {
    const user = userEvent.setup();
    fake.seed(createFilledDetailResponse(90, { policy: ALL_AGREED }));
    const router = await renderRoute(`${ROUTES.campaign}?tab=draft`);
    await screen.findByText("비글로우 신제품 런칭 캠페인");
    const statusKey = router.state.location.key;
    await router.navigate(ROUTES.campaignCreate);
    await router.navigate(`${ROUTES.campaignRegister}/90?step=payment`);

    await screen.findByRole("button", { name: /결제하기/ });
    await user.click(screen.getByRole("button", { name: "뒤로가기" }));

    // 같은 기록으로 돌아가야(POP) 스크롤 복원이 떠날 때 위치를 되돌림.
    await waitFor(() => expect(router.state.location.key).toBe(statusKey));
    expect(router.state.historyAction).toBe("POP");
    expect(router.state.location.search).toBe("?tab=draft");
  });

  it("현황 기록이 이 탭에 없으면(주소로 바로 들어옴·새로고침) 기억한 쿼리의 현황을 새로 열고, 브라우저 뒤로가기는 기록을 따른다", async () => {
    const user = userEvent.setup();
    useCampaignStatusReturnStore.setState({
      search: "?tab=draft",
      entryKey: null,
    });
    fake.seed(createFilledDetailResponse(90, { policy: ALL_AGREED }));
    const router = await renderRoute([
      ROUTES.campaign,
      ROUTES.campaignCreate,
      `${ROUTES.campaignRegister}/90?step=payment`,
    ]);

    // 불러오는 동안의 빈 셸이 본문으로 교체되면 먼저 찾은 버튼이 사라지므로 본문이 뜬 뒤에 누름.
    await screen.findByRole("button", { name: /결제하기/ });
    await user.click(screen.getByRole("button", { name: "뒤로가기" }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ROUTES.campaign),
    );
    expect(router.state.location.search).toBe("?tab=draft");

    await router.navigate(-1);
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        `${ROUTES.campaignRegister}/90`,
      ),
    );
  });
});

describe("현황 바로 가기의 구독 만료 안내", () => {
  const SWR_DEDUPING_MS = 2100;
  const SUBSCRIPTIONS_PATH = "/mypage/subscription/subscriptions";

  afterEach(() => {
    vi.useRealTimers();
  });

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

  it("다른 곳에서 구독해 캐시가 낡았으면 새로 읽은 구독으로 판단해 작성 화면으로 간다", async () => {
    mockSubscriptions(["pick"]);
    const router = await renderRoute(`${ROUTES.campaign}?tab=draft`);
    await screen.findByText("비글로우 신제품 런칭 캠페인");
    await waitForSubscriptions();
    mockSubscriptions(["recruit"]);
    await clickWriteOnRecruitDraft();

    await waitFor(() =>
      expect(router.state.location.pathname).toMatch(
        new RegExp(`^${ROUTES.campaignRegister}/\\d+$`),
      ),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("구독을 새로 읽다 실패하면 갖고 있던 구독으로 판단해 구독 안내를 띄운다", async () => {
    mockSubscriptions(["pick"]);
    const router = await renderRoute(`${ROUTES.campaign}?tab=draft`);
    await screen.findByText("비글로우 신제품 런칭 캠페인");
    await waitForSubscriptions();
    mockV3Get((path, ...rest) =>
      path === SUBSCRIPTIONS_PATH
        ? Promise.reject(new Error("network"))
        : fake.get(path, rest[0]),
    );
    await clickWriteOnRecruitDraft();

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("구독이 필요합니다")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(ROUTES.campaign);
  });

  it("다른 화면에 갔다가 돌아와도 구독 목록을 다시 읽지 않는다", async () => {
    // SWR은 2초 안에 같은 키를 다시 부르지 않아(중복 제거 타이머), 그 시간을 넘겨 돌아온 상황을 만듦.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockSubscriptions(["recruit"]);
    const router = await renderRoute(`${ROUTES.campaign}?tab=draft`);
    await screen.findByText("비글로우 신제품 런칭 캠페인");
    await waitForSubscriptions();
    const countReads = (target: string) =>
      vi.mocked(serverApiV3.get).mock.calls.filter(([path]) => path === target)
        .length;
    const subscriptionReadsBefore = countReads(SUBSCRIPTIONS_PATH);
    vi.advanceTimersByTime(SWR_DEDUPING_MS);

    await router.navigate(ROUTES.home);
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ROUTES.home),
    );
    await router.navigate(-1);
    await screen.findByText("비글로우 신제품 런칭 캠페인");
    // 캐시가 있는 키는 SWR이 그린 다음 프레임에 다시 읽으므로 몇 프레임을 넘겨 확인함.
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(countReads(SUBSCRIPTIONS_PATH)).toBe(subscriptionReadsBefore);
  });

  it("작성을 마친 데모의 작성하기는 작성 화면을 거치지 않고 기본 정보로 간다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute(`${ROUTES.campaign}?tab=draft`);
    const card = (await screen.findByText("초록숲 비건 스킨케어")).closest(
      "li",
    );
    if (!card) throw new Error("campaign card not found");
    // 작성 화면을 거치면 그 loader가 리다이렉트하며 주소 기록은 남기지 않으므로, 상세를 읽은 횟수로 구분함.
    const countDetailReads = () =>
      vi
        .mocked(serverApiV3.get)
        .mock.calls.filter(([path]) => path === "/campaign/3").length;
    const readsBefore = countDetailReads();

    await user.click(within(card).getByRole("button", { name: "작성하기" }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/campaign/3"),
    );

    expect(countDetailReads() - readsBefore).toBe(1);
  });
});
