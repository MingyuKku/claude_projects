import { isSubscriptionExpiredForWrite } from "./subscription-guard";

import type { SubscriptionProductType } from "@/entities/subscription";

const subscribed = (...types: SubscriptionProductType[]) => new Set(types);

describe("isSubscriptionExpiredForWrite", () => {
  it("그 서비스 구독이 없으면 막는다", () => {
    expect(
      isSubscriptionExpiredForWrite(
        { type: "pickBrand", isDemo: false },
        subscribed("recruit"),
      ),
    ).toBe(true);
    expect(
      isSubscriptionExpiredForWrite(
        { type: "recruitBrand", isDemo: false },
        subscribed(),
      ),
    ).toBe(true);
  });

  it("그 서비스 구독이 있으면 막지 않는다", () => {
    expect(
      isSubscriptionExpiredForWrite(
        { type: "pickBrand", isDemo: false },
        subscribed("pick"),
      ),
    ).toBe(false);
  });

  it("데모는 구독과 상관없이 막지 않는다", () => {
    expect(
      isSubscriptionExpiredForWrite(
        { type: "pickBrand", isDemo: true },
        subscribed(),
      ),
    ).toBe(false);
  });

  it("구독 상태나 유형을 모르면 막지 않는다(서버가 결제 때 검사)", () => {
    expect(
      isSubscriptionExpiredForWrite({ type: "pickBrand", isDemo: false }, null),
    ).toBe(false);
    expect(
      isSubscriptionExpiredForWrite(
        { type: null, isDemo: false },
        subscribed(),
      ),
    ).toBe(false);
  });
});
