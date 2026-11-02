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
      records: [{ ...item, receiptUrl: "https://iniweb.inicis.com/receipt" }],
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
});
