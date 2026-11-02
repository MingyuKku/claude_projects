import { toChargeQuery } from "./charge-query";

describe("toChargeQuery", () => {
  it("필터 값을 서버 코드와 기간으로 바꾼다", () => {
    expect(
      toChargeQuery(
        {
          type: "withdraw",
          status: "withdrawn",
          dateFrom: "2026-10-01",
          dateTo: "2026-10-31",
        },
        20,
      ),
    ).toEqual({
      entrySize: 20,
      type: "WITHDRAWAL",
      status: "WITHDRAWAL_COMPLETED",
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    });
  });

  it("필터가 없거나 모르는 값이면 개수만 보낸다", () => {
    expect(toChargeQuery({}, 10)).toEqual({ entrySize: 10 });
    expect(toChargeQuery({ type: "toString", status: "x" }, 10)).toEqual({
      entrySize: 10,
    });
  });
});
