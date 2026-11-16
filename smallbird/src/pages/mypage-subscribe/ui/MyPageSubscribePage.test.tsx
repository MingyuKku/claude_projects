import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Outlet, Route, Routes, useLocation } from "react-router";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";

import { MyPageSubscribePage } from "./MyPageSubscribePage";

import type { SessionViewModel } from "@/entities/session";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    serverApiV3: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

const PLANS_RESPONSE = {
  yearlyDiscountRate: 20,
  plans: [
    {
      productType: "recruit",
      isAvailable: true,
      monthlyPrice: 99000,
      yearlyPrice: 950400,
    },
    {
      productType: "pick",
      isAvailable: true,
      monthlyPrice: 199000,
      yearlyPrice: 1910400,
    },
    {
      productType: "live",
      isAvailable: false,
      monthlyPrice: 199000,
      yearlyPrice: 1910400,
    },
    {
      productType: "applicator",
      isAvailable: false,
      monthlyPrice: 199000,
      yearlyPrice: 1910400,
    },
  ],
};

// 모집형을 구독 중인 상태.
const SUBSCRIPTIONS_RESPONSE = [
  {
    id: "12",
    productType: "recruit",
    productName: "월 구독 상품_모집형",
    startedAt: "2026-10-01",
    endsAt: "2026-10-30",
    amount: 99000,
    paymentMethod: "card",
    isCancelScheduled: false,
  },
];

const CARDS_RESPONSE = [
  {
    id: "32",
    issuer: "하나카드",
    maskedNumber: "1234-56**-****-***7",
    isDefault: true,
  },
];

function mockApi(cards: unknown[] = CARDS_RESPONSE) {
  vi.mocked(serverApiV3.get).mockImplementation(async (path) => {
    if (path === "/mypage/subscription/plans") return PLANS_RESPONSE;
    if (path === "/mypage/subscription/subscriptions") {
      return SUBSCRIPTIONS_RESPONSE;
    }
    if (path === "/mypage/subscription/billing-cards") return cards;
    throw new Error(`unexpected request: ${path}`);
  });
}

beforeEach(() => {
  mockApi();
});

function Location() {
  const { search } = useLocation();
  return <p data-testid="search">{search}</p>;
}

const MASTER_SESSION: SessionViewModel = {
  isAllowed: true,
  userIdx: 1,
  accountIdx: 2,
  threadUserIdx: 3,
  authority: "MASTER",
  service: "client",
  displayName: "테스트",
  identifier: "tester",
  email: "test@example.com",
  profileImageUrl: null,
  permissions: {
    campaign: true,
    influencerMatching: true,
    influencerMarket: true,
    commerce: true,
    bigbirdMoney: true,
    purchaserQuestion: true,
    influencerQuestion: true,
  },
};

/** 세션은 MypageLayout처럼 Outlet context로 넘김. null은 비로그인. */
function setup(
  initialEntry: string,
  session: SessionViewModel | null = MASTER_SESSION,
) {
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<Outlet context={session} />}>
            <Route path="/mypage/subscribe" element={<MyPageSubscribePage />} />
          </Route>
        </Routes>
        <Location />
      </MemoryRouter>
    </SWRConfig>,
  );
  return userEvent.setup();
}

describe("MyPageSubscribePage 결제 화면", () => {
  it("연간으로 구독하기를 누르면 주소에 period가 담기고 결제 화면이 연간 문구를 보인다", async () => {
    const user = setup("/mypage/subscribe");
    await user.click(await screen.findByRole("radio", { name: /연간 결제/ }));
    await user.click(screen.getByRole("button", { name: "구독하기" }));

    expect(screen.getByTestId("search")).toHaveTextContent(
      "panel=checkout&plan=pick&period=yearly",
    );
    expect(screen.getByText("결제 즉시 1년 이용 시작")).toBeInTheDocument();
  });

  it("월간으로 구독하면 월간 문구를 보인다", async () => {
    const user = setup("/mypage/subscribe");
    await user.click(await screen.findByRole("button", { name: "구독하기" }));

    expect(screen.getByText("결제 즉시 1개월 이용 시작")).toBeInTheDocument();
  });

  it("잘못된 period는 월간으로 대체한다", async () => {
    setup("/mypage/subscribe?panel=checkout&plan=pick&period=weekly");
    expect(
      await screen.findByText("결제 즉시 1개월 이용 시작"),
    ).toBeInTheDocument();
  });

  it("period가 없으면 월간이다", async () => {
    setup("/mypage/subscribe?panel=checkout&plan=pick");
    expect(
      await screen.findByText("결제 즉시 1개월 이용 시작"),
    ).toBeInTheDocument();
  });

  it("구독 중인 상품 카드는 비활성 '구독 중'이다", async () => {
    setup("/mypage/subscribe");
    expect(
      await screen.findByRole("button", { name: "구독 중" }),
    ).toBeDisabled();
  });

  it("구독 중인 상품의 결제 화면 주소로 들어오면 결제 화면 대신 구독 탭을 보인다", async () => {
    setup("/mypage/subscribe?panel=checkout&plan=recruit");
    expect(
      await screen.findByRole("button", { name: "구독 중" }),
    ).toBeDisabled();
    expect(screen.queryByText("결제 즉시 1개월 이용 시작")).toBeNull();
    expect(screen.queryByRole("button", { name: "결제" })).toBeNull();
  });

  it("구독 목록을 읽지 못하면 오류 안내를 보이고 다시 시도하면 불러온다", async () => {
    let shouldFail = true;
    vi.mocked(serverApiV3.get).mockImplementation(async (path) => {
      if (path === "/mypage/subscription/plans") return PLANS_RESPONSE;
      if (shouldFail) throw new Error("fail");
      return SUBSCRIPTIONS_RESPONSE;
    });
    const user = setup("/mypage/subscribe");

    const retry = await screen.findByRole("button", { name: "다시 시도" });
    shouldFail = false;
    await user.click(retry);

    expect(
      await screen.findByRole("button", { name: "구독 중" }),
    ).toBeDisabled();
    expect(serverApiV3.get).toHaveBeenCalledWith(
      "/mypage/subscription/subscriptions",
    );
  });

  it("상품 목록을 읽지 못하면 오류 안내를 보이고 다시 시도하면 불러온다", async () => {
    vi.mocked(serverApiV3.get).mockRejectedValueOnce(new Error("fail"));
    const user = setup("/mypage/subscribe");

    await user.click(await screen.findByRole("button", { name: "다시 시도" }));

    expect(
      await screen.findByRole("button", { name: "구독하기" }),
    ).toBeInTheDocument();
    expect(serverApiV3.get).toHaveBeenCalledWith("/mypage/subscription/plans");
  });
});

describe("MyPageSubscribePage 카드 없음", () => {
  beforeEach(() => {
    mockApi([]);
  });

  it("구독하기를 누르면 결제 화면 대신 카드 등록 안내를 띄운다", async () => {
    const user = setup("/mypage/subscribe");
    // 카드를 다 읽은 뒤에 눌러야 안내가 뜸.
    await screen.findByRole("button", { name: "구독 중" });
    await user.click(screen.getByRole("button", { name: "구독하기" }));

    expect(
      await screen.findByRole("alertdialog", { name: "결제 카드 등록" }),
    ).toHaveTextContent(
      "등록된 카드가 없습니다. 구독 결제를 위해 카드를 먼저 등록해주세요.",
    );
    expect(
      screen.getByRole("button", { name: "결제 카드 등록하기" }),
    ).toBeEnabled();
    expect(screen.queryByText("결제 즉시 1개월 이용 시작")).toBeNull();
  });

  it("취소하면 안내가 닫히고 결제 쿼리가 지워진다", async () => {
    const user = setup("/mypage/subscribe");
    await screen.findByRole("button", { name: "구독 중" });
    await user.click(screen.getByRole("button", { name: "구독하기" }));
    await screen.findByRole("alertdialog", { name: "결제 카드 등록" });

    await user.click(screen.getByRole("button", { name: "취소" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(screen.getByTestId("search")).toBeEmptyDOMElement();
  });

  it("구독 중인 상품의 결제 화면 주소면 결제할 일이 없어 카드 등록 안내도 띄우지 않는다", async () => {
    setup("/mypage/subscribe?panel=checkout&plan=recruit");
    await screen.findByRole("button", { name: "구독 중" });
    await waitFor(() =>
      expect(serverApiV3.get).toHaveBeenCalledWith(
        "/mypage/subscription/billing-cards",
      ),
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("안내에서 카드를 등록하고 돌아오면 구독하려던 결제 화면을 다시 연다", async () => {
    // 카드 등록 전에는 0장, 이니시스에서 돌아와 다시 읽으면 1장.
    let cards: unknown[] = [];
    vi.mocked(serverApiV3.get).mockImplementation(async (path) => {
      if (path === "/mypage/subscription/plans") return PLANS_RESPONSE;
      if (path === "/mypage/subscription/subscriptions") {
        return SUBSCRIPTIONS_RESPONSE;
      }
      if (path === "/mypage/subscription/billing-cards") return cards;
      throw new Error(`unexpected request: ${path}`);
    });
    // "결제 카드 등록하기"가 이니시스로 떠나기 전에 남긴 값(RegisterCardDialog).
    sessionStorage.setItem(
      "billing-card-return-params",
      JSON.stringify({ panel: "checkout", plan: "pick", period: "yearly" }),
    );
    cards = CARDS_RESPONSE;
    setup("/mypage/subscribe?result=success&cardId=32");

    expect(
      await screen.findByText("결제 즉시 1년 이용 시작"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("search")).toHaveTextContent(
      "panel=checkout&plan=pick&period=yearly",
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(sessionStorage.getItem("billing-card-return-params")).toBeNull();
  });

  it("결제 화면 주소로 바로 들어와도 안내를 띄우고 취소하면 쿼리를 지운다", async () => {
    const user = setup("/mypage/subscribe?panel=checkout&plan=pick");
    await screen.findByRole("alertdialog", { name: "결제 카드 등록" });

    await user.click(screen.getByRole("button", { name: "취소" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(screen.getByTestId("search")).toBeEmptyDOMElement();
  });
});

describe("MyPageSubscribePage 비로그인", () => {
  it("상품 카드만 보이고 구독 목록·카드는 요청하지 않는다", async () => {
    setup("/mypage/subscribe", null);

    expect(
      (await screen.findAllByRole("button", { name: "구독하기" })).length,
    ).toBeGreaterThan(0);
    const paths = vi.mocked(serverApiV3.get).mock.calls.map(([path]) => path);
    expect(paths).toContain("/mypage/subscription/plans");
    expect(paths).not.toContain("/mypage/subscription/subscriptions");
    expect(paths).not.toContain("/mypage/subscription/billing-cards");
  });

  it("구독하기를 누르면 결제 화면 대신 로그인 안내를 띄운다", async () => {
    const user = setup("/mypage/subscribe", null);
    const [firstSubscribe] = await screen.findAllByRole("button", {
      name: "구독하기",
    });
    if (!firstSubscribe) throw new Error("구독하기 버튼이 없음");
    await user.click(firstSubscribe);

    expect(
      await screen.findByRole("alertdialog", { name: "로그인 필요" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("search")).toBeEmptyDOMElement();
  });

  it("다른 탭을 누르면 로그인 안내를 띄우고 구독 탭에 머문다", async () => {
    const user = setup("/mypage/subscribe", null);
    await user.click(await screen.findByRole("tab", { name: "결제내역" }));

    expect(
      await screen.findByRole("alertdialog", { name: "로그인 필요" }),
    ).toBeInTheDocument();
    // 알럿이 열리면 뒤 화면은 aria-hidden이라 hidden까지 찾음.
    expect(
      screen.getByRole("tab", { name: "구독", hidden: true }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("search")).toBeEmptyDOMElement();
  });

  it("주소로 다른 탭을 넣어도 구독 탭을 보인다", async () => {
    setup("/mypage/subscribe?tab=payments", null);
    expect(
      await screen.findByRole("tab", { name: "구독", selected: true }),
    ).toBeInTheDocument();
  });

  it("주소로 결제 화면을 넣어도 결제 화면 대신 구독 탭의 상품 카드를 보인다", async () => {
    setup("/mypage/subscribe?panel=checkout&plan=pick", null);
    // 상품 카드까지 그려진 뒤에 결제 화면이 없음을 확인함(결제 화면은 상품 목록을 읽은 뒤 열리므로).
    expect(
      await screen.findByRole("tab", { name: "구독", selected: true }),
    ).toBeInTheDocument();
    expect(
      (await screen.findAllByRole("button", { name: "구독하기" })).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("결제 즉시 1개월 이용 시작")).toBeNull();
  });
});
