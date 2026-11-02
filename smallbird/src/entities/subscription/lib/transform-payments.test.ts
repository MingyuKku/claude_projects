import { subscriptionPaymentListSchema } from "../model/schema";
import { transformPayments } from "./transform-payments";

const item = {
  id: "41",
  paidAt: "2026-10-01T09:30:00+09:00",
  name: "월 구독 상품_PICK형",
  amount: 199000,
  method: "card",
  status: "paid",
} as const;

describe("transformPayments", () => {
  it("전체 건수와 결제 내역을 화면 모델로 바꾼다", () => {
    expect(
      transformPayments({
        totalCount: 23,
        items: [{ ...item, receiptUrl: "https://iniweb.inicis.com/receipt" }],
      }),
    ).toEqual({
      totalCount: 23,
      records: [
        {
          ...item,
          cardKind: null,
          receiptUrl: "https://iniweb.inicis.com/receipt",
        },
      ],
    });
  });

  it("https가 아니거나 없는 거래명세서 주소는 null로 둔다", () => {
    const { records } = transformPayments({
      totalCount: 2,
      items: [
        { ...item, receiptUrl: "http://example.com/receipt" },
        { ...item, id: "42", receiptUrl: null },
      ],
    });
    expect(records.map((record) => record.receiptUrl)).toEqual([null, null]);
  });

  it("모르는 결제 수단·상태 코드가 와도 목록 전체를 거부하지 않고 서버 값을 그대로 둔다", () => {
    const parsed = subscriptionPaymentListSchema.parse({
      totalCount: 1,
      items: [{ ...item, method: "virtualAccount", status: "canceled" }],
    });
    expect(transformPayments(parsed).records[0]).toMatchObject({
      method: "virtualAccount",
      status: "canceled",
    });
  });

  it("카드 종류 코드를 담고, 없거나 모르는 값은 null로 둔다", () => {
    const { records } = transformPayments({
      totalCount: 3,
      items: [
        { ...item, cardKind: "debit" },
        { ...item, id: "42", cardKind: null },
        { ...item, id: "43", cardKind: "prepaid" },
      ],
    });
    expect(records.map((record) => record.cardKind)).toEqual([
      "debit",
      null,
      null,
    ]);
  });
});
