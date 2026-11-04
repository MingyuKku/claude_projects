import { canDeleteCard } from "./can-delete-card";

import type { BillingCard, Subscription } from "@/entities/subscription";

const defaultCard: BillingCard = {
  id: "card-1",
  issuer: "하나카드",
  maskedNumber: "1234-56**-****-***7",
  isDefault: true,
  cardKind: "credit",
};
const extraCard: BillingCard = {
  ...defaultCard,
  id: "card-2",
  isDefault: false,
};

function subscription(status: Subscription["status"]): Subscription {
  return {
    id: "sub-1",
    type: "recruit",
    productName: "월 구독 상품_모집형",
    startedAt: "2026-11-02",
    endsAt: "2026-12-02",
    amount: 99000,
    paymentMethod: "card",
    cardKind: "credit",
    isCancelScheduled: status === "cancelScheduled",
    status,
    nextRetryAt: status === "paymentFailed" ? "2026-11-04" : null,
  };
}

function context(
  cards: BillingCard[],
  subscriptions: Subscription[] | undefined = [],
  isSubscriptionsLoading = false,
) {
  return { cards, subscriptions, isSubscriptionsLoading };
}

describe("canDeleteCard", () => {
  it("여분 카드는 구독이 있어도, 구독을 읽는 중이어도 지울 수 있다", () => {
    const cards = [defaultCard, extraCard];
    expect(
      canDeleteCard(extraCard, context(cards, [subscription("active")])),
    ).toBe(true);
    expect(canDeleteCard(extraCard, context(cards, undefined, true))).toBe(
      true,
    );
  });

  it("다른 카드가 있으면 기본 카드는 지울 수 없다", () => {
    expect(canDeleteCard(defaultCard, context([defaultCard, extraCard]))).toBe(
      false,
    );
  });

  it("한 장뿐인 기본 카드는 구독이 없으면 지울 수 있다", () => {
    expect(canDeleteCard(defaultCard, context([defaultCard]))).toBe(true);
  });

  it.each(["active", "paymentFailed"] as const)(
    "한 장뿐인 기본 카드도 %s 구독이 있으면 지울 수 없다",
    (status) => {
      expect(
        canDeleteCard(
          defaultCard,
          context([defaultCard], [subscription(status)]),
        ),
      ).toBe(false);
    },
  );

  it("해지 예정 구독만 있으면 서버 판단에 맡겨 보여 준다", () => {
    expect(
      canDeleteCard(
        defaultCard,
        context([defaultCard], [subscription("cancelScheduled")]),
      ),
    ).toBe(true);
  });

  it("구독 목록을 읽는 중이면 아직 모르므로 기본 카드 삭제를 보이지 않는다", () => {
    expect(
      canDeleteCard(defaultCard, context([defaultCard], undefined, true)),
    ).toBe(false);
  });

  it("구독 목록 읽기에 실패했으면 서버 판단에 맡겨 보여 준다", () => {
    expect(
      canDeleteCard(defaultCard, context([defaultCard], undefined, false)),
    ).toBe(true);
  });
});
