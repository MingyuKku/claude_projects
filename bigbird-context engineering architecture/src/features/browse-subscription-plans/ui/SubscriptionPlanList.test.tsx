import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SubscriptionPlanList } from "./SubscriptionPlanList";

import type {
  Subscription,
  SubscriptionPlanCatalog,
} from "@/entities/subscription";

const CATALOG: SubscriptionPlanCatalog = {
  yearlyDiscountRate: 20,
  plans: [
    {
      type: "recruit",
      isAvailable: true,
      monthlyPrice: 99999,
      yearlyPrice: 959988,
    },
    {
      type: "pick",
      isAvailable: true,
      monthlyPrice: 199999,
      yearlyPrice: 1919988,
    },
    {
      type: "live",
      isAvailable: false,
      monthlyPrice: 199999,
      yearlyPrice: 1919988,
    },
    {
      type: "applicator",
      isAvailable: false,
      monthlyPrice: 199999,
      yearlyPrice: 1919988,
    },
  ],
};

// 모집형을 구독 중인 상태.
const SUBSCRIPTIONS: Subscription[] = [
  {
    id: "sub-1",
    type: "recruit",
    productName: "월 구독 상품_모집형",
    startedAt: "2026-10-01",
    endsAt: "2026-10-31",
    amount: 99999,
    paymentMethod: "card",
    isCancelScheduled: false,
  },
];

function setup() {
  const onSubscribe = vi.fn();
  render(
    <SubscriptionPlanList
      catalog={CATALOG}
      subscriptions={SUBSCRIPTIONS}
      onSubscribe={onSubscribe}
    />,
  );
  return { onSubscribe, user: userEvent.setup() };
}

describe("SubscriptionPlanList", () => {
  it("월간 결제가 기본이고 연간 결제로 바꾸면 카드 가격이 바뀐다", async () => {
    const { user } = setup();
    expect(screen.getByRole("radio", { name: /월간 결제/ })).toBeChecked();
    expect(screen.getByText("월 99,999원")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /연간 결제/ }));

    expect(screen.getByText("연 959,988원")).toBeInTheDocument();
    expect(screen.queryByText("월 99,999원")).toBeNull();
  });

  it("구독 중인 상품은 비활성 '구독 중'이고 다른 상품의 '구독하기'는 눌린다", async () => {
    const { user, onSubscribe } = setup();
    expect(screen.getByRole("button", { name: "구독 중" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "구독하기" }));

    expect(onSubscribe).toHaveBeenCalledExactlyOnceWith("pick", "monthly");
  });

  it("연간 결제를 고르고 구독하면 결제 주기를 함께 넘긴다", async () => {
    const { user, onSubscribe } = setup();
    await user.click(screen.getByRole("radio", { name: /연간 결제/ }));
    await user.click(screen.getByRole("button", { name: "구독하기" }));
    expect(onSubscribe).toHaveBeenCalledExactlyOnceWith("pick", "yearly");
  });

  it("라이브형·어플리에이터형은 준비중으로 비활성이다", () => {
    setup();
    const buttons = screen.getAllByRole("button", { name: "준비중" });
    expect(buttons).toHaveLength(2);
    for (const button of buttons) expect(button).toBeDisabled();
    expect(screen.getAllByText("추후 제공 예정이에요.")).toHaveLength(2);
  });

  it("상세보기는 카드마다 따로 펼치고 접는다", async () => {
    const { user } = setup();
    const [recruitDetail, pickDetail] = screen.getAllByRole("button", {
      name: "상세보기",
    });

    await user.click(recruitDetail!);
    expect(screen.getByText("모집형 소개")).toBeInTheDocument();
    expect(screen.queryByText("PICK형 소개")).toBeNull();

    await user.click(pickDetail!);
    expect(screen.getByText("PICK형 소개")).toBeInTheDocument();
    expect(screen.getByText("모집형 소개")).toBeInTheDocument();

    await user.click(recruitDetail!);
    expect(screen.queryByText("모집형 소개")).toBeNull();
    expect(screen.getByText("PICK형 소개")).toBeInTheDocument();
  });

  it("펼치면 이용 방식 5단계를 보여 준다", async () => {
    const { user } = setup();
    await user.click(screen.getAllByRole("button", { name: "상세보기" })[0]!);
    const steps = screen.getByText("이용 방식").parentElement!;
    for (const label of [
      "캠페인 등록",
      "인플루언서 모집",
      "신청자 확인",
      "인플루언서 선정",
      "캠페인 진행",
    ]) {
      expect(within(steps).getByText(label)).toBeInTheDocument();
    }
  });
});
