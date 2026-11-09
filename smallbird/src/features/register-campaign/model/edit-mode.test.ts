import { isSectionLockedInEdit } from "./edit-mode";

describe("isSectionLockedInEdit", () => {
  it("부가서비스·정책 동의·결제는 잠기고 나머지 섹션은 고칠 수 있다", () => {
    expect(isSectionLockedInEdit("ADD_ONS")).toBe(true);
    expect(isSectionLockedInEdit("POLICY")).toBe(true);
    expect(isSectionLockedInEdit("PAYMENT")).toBe(true);

    expect(isSectionLockedInEdit("CAMPAIGN_INFO")).toBe(false);
    expect(isSectionLockedInEdit("PRODUCT")).toBe(false);
    expect(isSectionLockedInEdit("INFLUENCER")).toBe(false);
    expect(isSectionLockedInEdit("INTRO")).toBe(false);
    // 6단계는 인원·리워드 칸만 잠그므로 섹션 전체는 고칠 수 있음.
    expect(isSectionLockedInEdit("CONDITIONS")).toBe(false);
  });
});
