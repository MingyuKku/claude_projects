import { fromIsoDate, toDateRange, toIsoDate } from "./date-range";

describe("등록일 범위 변환", () => {
  it("지역 날짜를 yyyy-MM-dd로 바꾸고 다시 읽는다", () => {
    const date = new Date(2026, 10, 7);
    expect(toIsoDate(date)).toBe("2026-11-07");
    expect(fromIsoDate("2026-11-07")).toEqual(date);
  });

  it("형식이 틀리거나 없는 날짜는 읽지 않는다", () => {
    expect(fromIsoDate("2026-13-01")).toBeUndefined();
    expect(fromIsoDate("2026-02-30")).toBeUndefined();
    expect(fromIsoDate("20261107")).toBeUndefined();
    expect(fromIsoDate(null)).toBeUndefined();
  });

  it("시작일이 없으면 범위가 없고, 종료일만 없으면 시작일만 담는다", () => {
    expect(toDateRange(undefined, "2026-11-07")).toBeUndefined();
    expect(toDateRange("2026-11-01", undefined)).toEqual({
      from: new Date(2026, 10, 1),
      to: undefined,
    });
  });
});
