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
        cardKind: null,
        isCancelScheduled: false,
        status: "active",
        nextRetryAt: null,
      },
    ]);
  });

  it("정기결제 실패 구독의 상태와 다음 재결제 날짜를 담는다", () => {
    const [failed] = transformSubscriptions([
      {
        ...item,
        id: "9",
        endsAt: "2026-11-03",
        cardKind: "debit",
        status: "paymentFailed",
        nextRetryAt: "2026-11-04",
      },
    ]);
    expect(failed).toMatchObject({
      id: "9",
      status: "paymentFailed",
      nextRetryAt: "2026-11-04",
      isCancelScheduled: false,
    });
  });

  it("해지 예정 상태를 담고 재결제 날짜는 없다", () => {
    const [scheduled] = transformSubscriptions([
      {
        ...item,
        isCancelScheduled: true,
        status: "cancelScheduled",
        nextRetryAt: null,
      },
    ]);
    expect(scheduled).toMatchObject({
      status: "cancelScheduled",
      nextRetryAt: null,
    });
  });

  it("상태가 없거나 모르는 값이면 해지 예정 여부로 가린다", () => {
    const withoutStatus = transformSubscriptions([
      item,
      { ...item, id: "13", isCancelScheduled: true },
    ]);
    expect(withoutStatus.map(({ status }) => status)).toEqual([
      "active",
      "cancelScheduled",
    ]);

    const unknown = transformSubscriptions([{ ...item, status: "suspended" }]);
    expect(unknown[0]?.status).toBe("active");
  });

  it("카드 종류 코드를 담고, 없거나 모르는 값은 null로 둔다", () => {
    const kinds = transformSubscriptions([
      { ...item, cardKind: "debit" },
      { ...item, id: "13", cardKind: "credit" },
      { ...item, id: "14", cardKind: null },
      { ...item, id: "15", cardKind: "prepaid" },
    ]).map((subscription) => subscription.cardKind);
    expect(kinds).toEqual(["debit", "credit", null, null]);
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
