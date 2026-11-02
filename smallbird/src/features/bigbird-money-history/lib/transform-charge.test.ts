import { transformChargeList } from "./transform-charge";

const paid = {
  requestDate: "2026-10-23 14:23:18",
  expiredDate: "2026-10-25 23:59:59",
  requestAmount: 50000,
  bankName: "신한은행",
  accountNumber: "1234567890123456",
  depositDate: "2026-10-23 15:00:00",
  depositState: "결제완료",
  receiptUrl: "https://iniweb.inicis.com/receipt?tid=1",
  payMethod: "VBank",
};

function transform(
  ...items: Array<Partial<typeof paid> | Record<string, null>>
) {
  return transformChargeList({
    list: items.map((item) => ({ ...paid, ...item })),
    count: items.length,
    currentPage: 1,
    entrySize: 10,
  });
}

describe("transformChargeList", () => {
  it("결제 완료 건은 상태 코드와 거래명세서 주소를 갖는다", () => {
    const [record] = transform({}).records;
    expect(record).toMatchObject({
      id: "0",
      amount: 50000,
      payMethod: "VBank",
      status: "paid",
      bankName: "신한은행",
      accountNumber: "1234567890123456",
      receiptUrl: "https://iniweb.inicis.com/receipt?tid=1",
    });
    expect(record?.requestedAt).toEqual(new Date("2026-10-23T14:23:18"));
    expect(record?.depositedAt).toEqual(new Date("2026-10-23T15:00:00"));
  });

  it("대기 중·결제 취소 건은 거래명세서 주소가 있어도 비운다", () => {
    const { records } = transform(
      { depositState: "대기중" },
      { depositState: "결제취소" },
    );
    expect(records.map((record) => record.status)).toEqual([
      "pending",
      "canceled",
    ]);
    expect(records.map((record) => record.receiptUrl)).toEqual([null, null]);
  });

  it("미입금의 N/A 입금일은 대시로 두고 날짜는 null이다", () => {
    const [record] = transform({
      depositState: "대기중",
      depositDate: "N/A",
    }).records;
    expect(record?.depositedAt).toBeNull();
    expect(record?.depositedAtText).toBe("-");
  });

  it("모르는 입금 상태는 코드 없이 서버 값을 그대로 둔다", () => {
    const [record] = transform({ depositState: "입금완료" }).records;
    expect(record?.status).toBeNull();
    expect(record?.statusText).toBe("입금완료");
  });

  it("열 수 없는 거래명세서 주소는 버린다", () => {
    const [record] = transform({ receiptUrl: "javascript:alert(1)" }).records;
    expect(record?.receiptUrl).toBeNull();
  });

  it("값이 없는 항목은 대시·null로 둔다", () => {
    const [record] = transform({
      requestAmount: null,
      bankName: null,
      accountNumber: "",
      payMethod: null,
    } as never).records;
    expect(record).toMatchObject({
      amount: null,
      bankName: "-",
      accountNumber: "-",
      payMethod: "",
    });
  });
});
