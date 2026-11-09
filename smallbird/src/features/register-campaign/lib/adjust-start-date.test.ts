import { adjustPastStartDate } from "./adjust-start-date";
import { createDraftFixture } from "./test-utils";

const TODAY = new Date(2026, 10, 6);

function draftWith(startDate: string | null) {
  const base = createDraftFixture();
  return createDraftFixture({
    campaignInfo: { ...base.campaignInfo, startDate },
  });
}

describe("adjustPastStartDate", () => {
  it("지난 날짜면 오늘로 맞춘다", () => {
    expect(
      adjustPastStartDate(draftWith("2026-11-05"), TODAY).campaignInfo
        .startDate,
    ).toBe("2026-11-06");
  });

  it("오늘이거나 앞으로의 날짜는 그대로 둔다", () => {
    const today = draftWith("2026-11-06");
    const future = draftWith("2026-12-01");

    expect(adjustPastStartDate(today, TODAY)).toBe(today);
    expect(adjustPastStartDate(future, TODAY)).toBe(future);
  });

  it("시작일이 없으면 그대로 둔다", () => {
    const empty = draftWith(null);

    expect(adjustPastStartDate(empty, TODAY)).toBe(empty);
  });
});
