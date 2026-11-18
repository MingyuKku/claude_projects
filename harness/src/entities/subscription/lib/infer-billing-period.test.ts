import { inferBillingPeriod } from "./infer-billing-period";

describe("inferBillingPeriod", () => {
  it.each([
    ["2026-11-02", "2026-12-02", "monthly"],
    ["2026-02-01", "2026-03-01", "monthly"],
    ["2026-01-31", "2026-02-28", "monthly"],
    ["2026-11-02", "2027-11-02", "yearly"],
    ["2027-11-02", "2028-11-02", "yearly"],
    ["2026-11-02", "2026-11-20", null],
    ["2026-11-02", "invalid", null],
  ])("%s ~ %s → %s", (startedAt, endsAt, expected) => {
    expect(inferBillingPeriod(startedAt, endsAt)).toBe(expected);
  });
});
