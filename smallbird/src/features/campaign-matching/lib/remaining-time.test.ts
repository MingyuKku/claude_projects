import { getNextExpiryDelay, getRemainingTime } from "./remaining-time";

const NOW = new Date("2026-11-27T12:00:00+09:00").getTime();

describe("getRemainingTime", () => {
  it("하루 이상이면 일·시간으로 나눈다", () => {
    expect(getRemainingTime("2026-11-30T09:30:00+09:00", NOW)).toEqual({
      unit: "day",
      days: 2,
      hours: 21,
    });
  });

  it("하루 미만이면 시간·분으로 나눈다", () => {
    expect(getRemainingTime("2026-11-27T15:45:30+09:00", NOW)).toEqual({
      unit: "hour",
      hours: 3,
      minutes: 45,
    });
  });

  it("기한이 없거나 지났으면 없다", () => {
    expect(getRemainingTime(null, NOW)).toBeNull();
    expect(getRemainingTime("2026-11-27T11:59:00+09:00", NOW)).toBeNull();
  });
});

describe("getNextExpiryDelay", () => {
  it("남은 것 중 가장 가까운 기한까지의 시간", () => {
    expect(
      getNextExpiryDelay(
        [null, "2026-11-27T11:00:00+09:00", "2026-11-27T12:10:00+09:00"],
        NOW,
      ),
    ).toBe(10 * 60_000);
    expect(getNextExpiryDelay([null], NOW)).toBeNull();
    // 타이머 한도(약 24.8일)를 넘는 기한은 잡지 않음.
    expect(getNextExpiryDelay(["2099-01-01T00:00:00+09:00"], NOW)).toBeNull();
  });
});
