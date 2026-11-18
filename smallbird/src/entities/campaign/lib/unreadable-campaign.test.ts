import { ApiError } from "@/shared/api";

import {
  isUnreadableCampaignError,
  isUnreadableCampaignReason,
} from "./unreadable-campaign";

describe("isUnreadableCampaignError", () => {
  it("404와 접근 거부·없는 캠페인 코드는 읽을 수 없는 캠페인으로 본다", () => {
    expect(isUnreadableCampaignError(new ApiError(404, undefined))).toBe(true);
    expect(
      isUnreadableCampaignError(
        new ApiError(403, { result: false, reason: "CAMPAIGN_ACCESS_DENIED" }),
      ),
    ).toBe(true);
  });

  it("그 밖의 오류는 아니다", () => {
    expect(isUnreadableCampaignError(new ApiError(500, undefined))).toBe(false);
    expect(
      isUnreadableCampaignError(
        new ApiError(403, { result: false, reason: "SUB_ACCOUNT_NOT_ALLOWED" }),
      ),
    ).toBe(false);
    expect(isUnreadableCampaignError(new Error("x"))).toBe(false);
  });
});

describe("isUnreadableCampaignReason", () => {
  it("코드가 없으면 아니다", () => {
    expect(isUnreadableCampaignReason(undefined)).toBe(false);
    expect(isUnreadableCampaignReason("CAMPAIGN_NOT_FOUND")).toBe(true);
  });
});
