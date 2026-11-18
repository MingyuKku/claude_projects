import { isRealtimeOpenHours } from "./business-hours";

describe("isRealtimeOpenHours", () => {
  it("한국 시간 평일 10시부터 18시 전까지만 연다", () => {
    // 2026-10-29는 목요일
    expect(isRealtimeOpenHours(new Date("2026-10-29T09:59:59+09:00"))).toBe(
      false,
    );
    expect(isRealtimeOpenHours(new Date("2026-10-29T10:00:00+09:00"))).toBe(
      true,
    );
    expect(isRealtimeOpenHours(new Date("2026-10-29T17:59:59+09:00"))).toBe(
      true,
    );
    expect(isRealtimeOpenHours(new Date("2026-10-29T18:00:00+09:00"))).toBe(
      false,
    );
  });

  it("한국 시간 주말에는 닫는다", () => {
    expect(isRealtimeOpenHours(new Date("2026-10-31T12:00:00+09:00"))).toBe(
      false,
    );
    expect(isRealtimeOpenHours(new Date("2026-11-01T12:00:00+09:00"))).toBe(
      false,
    );
  });

  it("다른 시간대의 시각도 한국 시간으로 판정한다", () => {
    // 뉴욕 목요일 21시 = 한국 금요일 10시(열림), 런던 금요일 10시 = 한국 금요일 18시(닫힘)
    expect(isRealtimeOpenHours(new Date("2026-10-29T21:00:00-04:00"))).toBe(
      true,
    );
    expect(isRealtimeOpenHours(new Date("2026-10-30T10:00:00+01:00"))).toBe(
      false,
    );
  });
});
