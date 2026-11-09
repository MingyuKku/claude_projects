import { getCampaignStepModels } from "../model/step-definitions";
import { getStepIndicators } from "./step-indicators";
import { createDraftFixture } from "./test-utils";

import type { StepSlug } from "../model/steps";
import type { CampaignDraft } from "@/entities/campaign";

const STEPS = getCampaignStepModels("PICK");

function indicators(draft: CampaignDraft, current: StepSlug) {
  return Object.fromEntries(
    getStepIndicators(STEPS, draft, current).map((item) => [
      item.slug,
      `${item.state}${item.hasAlert ? "!" : ""}`,
    ]),
  );
}

describe("getStepIndicators", () => {
  it("처음에는 현재 단계만 강조하고 나머지는 흐리다", () => {
    expect(indicators(createDraftFixture(), "campaign-info")).toEqual({
      "campaign-info": "current",
      product: "unvisited",
      influencer: "unvisited",
      "add-ons": "unvisited",
      intro: "unvisited",
      conditions: "unvisited",
      policy: "unvisited",
      payment: "unvisited",
    });
  });

  it("가 봤고 입력 조건을 통과한 단계는 완료이고, 가 봤는데 비어 있으면 경고다", () => {
    const draft = createDraftFixture({
      visitedSteps: ["CAMPAIGN_INFO", "PRODUCT"],
      campaignInfo: {
        name: "봄",
        campaignType: "PRESS",
        brandIdx: 1,
        startDate: "2026-12-01",
        endDate: null,
      },
    });

    expect(indicators(draft, "influencer")).toMatchObject({
      "campaign-info": "done",
      // 기자단형은 2단계에 입력할 것이 없어 통과.
      product: "done",
      influencer: "current",
    });
    expect(
      indicators(
        createDraftFixture({ visitedSteps: ["CAMPAIGN_INFO"] }),
        "product",
      )["campaign-info"],
    ).toBe("visited!");
  });

  it("2단계에서 6단계로 건너뛰면 3~5단계에 경고가 뜨고 선택 단계인 4단계는 뜨지 않는다", () => {
    const draft = createDraftFixture({
      visitedSteps: ["CAMPAIGN_INFO", "PRODUCT", "CONDITIONS"],
    });

    expect(indicators(draft, "conditions")).toMatchObject({
      influencer: "visited!",
      "add-ons": "visited",
      intro: "visited!",
      conditions: "current",
      policy: "unvisited",
      payment: "unvisited",
    });
  });

  it("건너뛴 단계라도 입력을 마쳤으면 경고 없이 번호로 보인다", () => {
    const draft = createDraftFixture({
      visitedSteps: ["CAMPAIGN_INFO", "CONDITIONS"],
      influencer: {
        platform: "INSTAGRAM",
        gender: "ALL",
        ageGroups: ["AGE_20S"],
        topics: ["BEAUTY"],
      },
    });

    expect(indicators(draft, "conditions").influencer).toBe("visited");
  });

  it("앞 단계로 돌아가도 가 본 가장 뒤 단계까지는 흐려지지 않는다", () => {
    const draft = createDraftFixture({
      visitedSteps: ["CAMPAIGN_INFO", "PRODUCT", "INFLUENCER", "ADD_ONS"],
    });

    expect(indicators(draft, "campaign-info")).toMatchObject({
      influencer: "visited!",
      // 가 봤고 선택 단계라 조건을 통과해 완료.
      "add-ons": "done",
      intro: "unvisited",
    });
  });

  it("현재 단계가 비어 있어도 경고하지 않는다", () => {
    expect(
      indicators(createDraftFixture({ visitedSteps: ["PRODUCT"] }), "product")
        .product,
    ).toBe("current");
  });
});
