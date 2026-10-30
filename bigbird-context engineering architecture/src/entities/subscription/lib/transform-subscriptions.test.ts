import { transformSubscriptions } from "./transform-subscriptions";

const item = {
  id: "12",
  productType: "recruit",
  productName: "월 구독 상품_모집형",
  startedAt: "2026-10-01",
  endsAt: "2026-10-30",
  amount: 99000,
  paymentMethod: "card",
  isCancelScheduled: false,
};

describe("transformSubscriptions", () => {
  it("응답을 화면 모델로 바꾼다", () => {
    expect(transformSubscriptions([item])).toEqual([
      {
        id: "12",
        type: "recruit",
        productName: "월 구독 상품_모집형",
        startedAt: "2026-10-01",
        endsAt: "2026-10-30",
        amount: 99000,
        paymentMethod: "card",
        isCancelScheduled: false,
      },
    ]);
  });

  it("구독이 없으면 빈 배열이다", () => {
    expect(transformSubscriptions([])).toEqual([]);
  });

  it("화면이 모르는 상품 유형은 건너뛴다", () => {
    expect(
      transformSubscriptions([{ ...item, productType: "unknown" }, item]),
    ).toHaveLength(1);
  });
});
