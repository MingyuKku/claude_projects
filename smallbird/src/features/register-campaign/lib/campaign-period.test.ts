import { calculateEndDate, startOfToday } from "./campaign-period";

describe("calculateEndDate", () => {
  it("시작일 + 30일을 돌려준다", () => {
    expect(calculateEndDate("2026-12-01")).toBe("2026-12-31");
    expect(calculateEndDate("2026-11-10")).toBe("2026-12-10");
  });

  it("월말·연말을 넘겨 계산한다", () => {
    expect(calculateEndDate("2026-12-20")).toBe("2027-01-19");
    expect(calculateEndDate("2028-02-01")).toBe("2028-03-02");
  });

  it("시작일이 없거나 형식이 틀리면 null이다", () => {
    expect(calculateEndDate(null)).toBeNull();
    expect(calculateEndDate("2026-13-40")).toBeNull();
    expect(calculateEndDate("내일")).toBeNull();
  });
});

describe("startOfToday", () => {
  it("시각을 버린 오늘 0시를 돌려준다", () => {
    const today = startOfToday(new Date(2026, 10, 6, 15, 30, 45));

    expect(today).toEqual(new Date(2026, 10, 6, 0, 0, 0));
  });
});
