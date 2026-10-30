import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";

import { MyPageSubscribePage } from "./MyPageSubscribePage";

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

beforeEach(() => {
  vi.mocked(serverApiV3.get).mockImplementation(async (path) => {
    if (path === "/mypage/subscription/plans") return PLANS_RESPONSE;
    if (path === "/mypage/subscription/subscriptions") {
      return SUBSCRIPTIONS_RESPONSE;
    }
    throw new Error(`unexpected request: ${path}`);
  });
});

function Location() {
  const { search } = useLocation();
  return <p data-testid="search">{search}</p>;
}

function setup(initialEntry: string) {
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <MyPageSubscribePage />
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
    setup("/mypage/subscribe?panel=checkout&plan=recruit");
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
