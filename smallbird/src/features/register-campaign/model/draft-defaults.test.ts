import { createEmptyDraft } from "@/entities/campaign";

import { applyDraftDefaults } from "./draft-defaults";

describe("applyDraftDefaults", () => {
  it("비어 있는 선택 칸을 시안의 기본 선택으로 채운다", () => {
    const draft = applyDraftDefaults(createEmptyDraft());

    expect(draft.info.campaignType).toBe("PRODUCT_DELIVERY");
    expect(draft.creator).toEqual({
      platform: "INSTAGRAM",
      gender: "FEMALE",
      ageGroups: ["AGE_10S"],
      topics: ["Beauty"],
    });
    expect(draft.conditions).toMatchObject({
      postingPeriodMonths: 1,
      secondaryCopyright: true,
    });
  });

  it("공구형은 연령대·주제 기본 선택이 시안대로 '무관'이다", () => {
    const draft = applyDraftDefaults(createEmptyDraft(), {
      productType: "GROUP_BUY",
    });

    expect(draft.creator).toEqual({
      platform: "INSTAGRAM",
      gender: "FEMALE",
      ageGroups: ["ALL"],
      topics: ["All"],
    });
  });

  it("서버에 저장된 값은 그대로 두고 비어 있는 칸만 채운다", () => {
    const saved = createEmptyDraft();
    saved.info.campaignType = "STORE_VISIT";
    saved.creator = {
      platform: "YOUTUBE",
      gender: null,
      ageGroups: ["AGE_40S"],
      topics: [],
    };
    saved.conditions.secondaryCopyright = false;
    saved.conditions.postingPeriodMonths = 12;

    const draft = applyDraftDefaults(saved);

    expect(draft.info.campaignType).toBe("STORE_VISIT");
    expect(draft.creator).toEqual({
      platform: "YOUTUBE",
      gender: "FEMALE",
      ageGroups: ["AGE_40S"],
      topics: ["Beauty"],
    });
    expect(draft.conditions.secondaryCopyright).toBe(false);
    expect(draft.conditions.postingPeriodMonths).toBe(12);
  });

  it("서버가 모르는 유형이면 유형은 채우지 않는다", () => {
    const draft = applyDraftDefaults(createEmptyDraft(), {
      hasServerCampaignType: true,
    });

    expect(draft.info.campaignType).toBeNull();
  });

  it("입력하지 않은 칸(이름·제품 정보·소개서)은 건드리지 않는다", () => {
    const draft = applyDraftDefaults(createEmptyDraft());

    expect(draft.info.name).toBe("");
    expect(draft.product).toEqual(createEmptyDraft().product);
    expect(draft.intro).toEqual(createEmptyDraft().intro);
  });
});
