import { createEmptyDraft } from "@/entities/campaign";

import { addHashtag } from "./hashtags";
import { createRegisterWizardStore } from "./store";

import type { CampaignDetail, CampaignDraft } from "@/entities/campaign";

function createDetail(patch?: (draft: CampaignDraft) => void): CampaignDetail {
  const draft = createEmptyDraft();
  patch?.(draft);
  return {
    campaignIdx: 15,
    campaignCode: "PB-00000000000015",
    serviceType: "PICK",
    productType: "BRAND",
    stage: "DRAFT",
    rawStatus: "DRAFT",
    isDemo: false,
    isDemoCompleted: false,
    rejectReason: null,
    brand: null,
    rawCampaignType: null,
    endDate: null,
    draft,
    payment: null,
  };
}

const GENERATED: CampaignDraft["intro"] = {
  mainImage: { attachmentIdx: 1, url: "blob:main", mediaType: "IMAGE" },
  detailMedia: [{ attachmentIdx: 2, url: "blob:detail", mediaType: "IMAGE" }],
  description: "AI 설명",
  notice: "AI 유의사항",
  titleHashtags: [],
  contentHashtags: ["협찬"],
};

describe("소개서 작성 방식", () => {
  it("소개서 입력이 없으면 AI, 있으면 직접 작성으로 연다", () => {
    expect(createRegisterWizardStore(createDetail()).getState().introMode).toBe(
      "AI",
    );
    expect(
      createRegisterWizardStore(
        createDetail((draft) => {
          draft.intro.description = "직접 쓴 설명";
        }),
      ).getState().introMode,
    ).toBe("MANUAL");
  });
});

describe("AI 소개서 생성", () => {
  it("결과가 오면 소개서 전체를 덮어쓴다(사용자가 고친 내용 포함)", () => {
    const store = createRegisterWizardStore(
      createDetail((draft) => {
        draft.intro.notice = "직접 고친 유의사항";
      }),
    );
    const jobId = store.getState().startIntroGeneration();

    store.getState().finishIntroGeneration(jobId, GENERATED);

    const { draft, introAi } = store.getState();
    expect(draft.intro).toEqual(GENERATED);
    expect(introAi).toMatchObject({
      jobId: null,
      hasResult: true,
      lastOutcome: "SUCCEEDED",
    });
  });

  it("실패하면 기존 입력을 그대로 둔다", () => {
    const store = createRegisterWizardStore(
      createDetail((draft) => {
        draft.intro.description = "기존 설명";
      }),
    );
    const jobId = store.getState().startIntroGeneration();

    store.getState().finishIntroGeneration(jobId, null);

    expect(store.getState().draft.intro.description).toBe("기존 설명");
    expect(store.getState().introAi).toMatchObject({
      jobId: null,
      lastOutcome: "FAILED",
    });
  });

  it("생성 중에 유형을 바꾸면 그 작업의 결과는 버린다", () => {
    const store = createRegisterWizardStore(createDetail());
    const jobId = store.getState().startIntroGeneration();

    store.getState().changeCampaignType("PRESS");
    store.getState().finishIntroGeneration(jobId, GENERATED);

    expect(store.getState().draft.intro).toEqual(createEmptyDraft().intro);
    expect(store.getState().introAi.hasResult).toBe(false);
  });
});

describe("addHashtag", () => {
  it("앞뒤 공백과 #을 떼고 더한다", () => {
    expect(addHashtag(["협찬"], "  #체험단 ")).toEqual(["협찬", "체험단"]);
  });

  it("빈 값이나 같은 칸에 있는 값은 더하지 않는다", () => {
    expect(addHashtag(["협찬"], "협찬")).toEqual(["협찬"]);
    expect(addHashtag(["협찬"], " # ")).toEqual(["협찬"]);
  });
});
