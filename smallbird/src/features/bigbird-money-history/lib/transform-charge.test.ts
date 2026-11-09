import { transformChargeList } from "./transform-charge";

import type { ChargeList } from "../model/charge-schema";

const paid = {
  id: "834",
  type: "CHARGE",
  status: "DEPOSIT_COMPLETED",
  requestDate: "2026-10-23 14:23:18",
  completedDate: "2026-10-23 15:00:00",
  amount: 50000,
  payMethod: "VBANK",
  bankName: "신한은행",
  accountNumber: "1234567890123456",
  holderName: "밍구스",
  receiptUrl: "https://iniweb.inicis.com/receipt?tid=1",
};

type Item = ChargeList["list"][number];

function transform(...items: Array<Partial<Item>>) {
  return transformChargeList({
    list: items.map((item) => ({ ...paid, ...item })),
    count: 23,
    currentPage: 1,
    entrySize: 10,
  });
}

describe("transformChargeList", () => {
  it("입금 완료 충전 건은 구분·상태 코드와 거래명세서 주소를 갖고 쪽 수는 응답 쪽 크기로 계산한다", () => {
    const { records, totalPages } = transform({});
    expect(totalPages).toBe(3);
    expect(records[0]).toMatchObject({
      id: "charge-834",
      serverId: "834",
      type: "charge",
      amount: 50000,
      payMethod: "VBANK",
      status: "paid",
      bankName: "신한은행",
      accountNumber: "1234567890123456",
      holderName: "밍구스",
      receiptUrl: "https://iniweb.inicis.com/receipt?tid=1",
    });
    expect(records[0]?.requestedAt).toEqual(new Date("2026-10-23T14:23:18"));
    expect(records[0]?.completedAt).toEqual(new Date("2026-10-23T15:00:00"));
  });

  it("출금 건은 id에 구분을 붙여 충전 건과 겹치지 않는다", () => {
    const { records } = transform(
      {},
      { type: "WITHDRAWAL", status: "WITHDRAWAL_COMPLETED", receiptUrl: null },
    );
    expect(
      records.map((record) => [record.id, record.type, record.status]),
    ).toEqual([
      ["charge-834", "charge", "paid"],
      ["withdraw-834", "withdraw", "withdrawn"],
    ]);
  });

  it("대기 중·미입금 취소 건은 거래명세서 주소가 있어도 비운다", () => {
    const { records } = transform(
      { status: "PENDING" },
      { status: "DEPOSIT_EXPIRED" },
    );
    expect(records.map((record) => record.status)).toEqual([
      "pending",
      "canceled",
    ]);
    expect(records.map((record) => record.receiptUrl)).toEqual([null, null]);
  });

  it("값이 없는 항목은 빈 문자열로 두고 날짜·금액은 null이다", () => {
    const [record] = transform({
      status: "PENDING",
      completedDate: null,
      amount: null,
      bankName: null,
      accountNumber: null,
      holderName: null,
      payMethod: null,
    }).records;
    expect(record).toMatchObject({
      completedAt: null,
      completedAtText: "",
      amount: null,
      bankName: "",
      accountNumber: "",
      holderName: "",
      payMethod: "",
    });
  });

  it("모르는 구분·상태는 null이고 서버 값을 그대로 둔다", () => {
    const [record] = transform({
      type: "REFUND",
      status: "WITHDRAWAL_REJECTED",
    }).records;
    expect(record).toMatchObject({
      id: "refund-834",
      type: null,
      typeText: "REFUND",
      status: null,
      statusText: "WITHDRAWAL_REJECTED",
    });
  });
});
