import { CAMPAIGN_PLATFORMS } from "../model/codes";
import { getCampaignPlatformIcon } from "./platform-icon";

describe("getCampaignPlatformIcon", () => {
  it("블로그는 네이버 로고를 쓰고, 모든 플랫폼이 로고를 가진다", () => {
    expect(getCampaignPlatformIcon("NAVER_BLOG")).toBe("naver");
    for (const platform of CAMPAIGN_PLATFORMS) {
      expect(getCampaignPlatformIcon(platform)).toBeTruthy();
    }
  });
});
