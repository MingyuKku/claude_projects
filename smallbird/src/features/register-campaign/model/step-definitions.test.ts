import { createDraftFixture } from "../lib/test-utils";
import {
  findFirstIncompleteStep,
  getCampaignStepModels,
  isStepComplete,
} from "./step-definitions";

import type { StepSlug } from "./steps";
import type { CampaignDraft, CampaignType } from "@/entities/campaign";

const ADDRESS = { zonecode: "06236", address: "서울 강남구", detail: "1층" };
const FILE = {
  fileId: "f1",
  url: "blob:f1",
  mediaType: "IMAGE" as const,
  durationSec: null,
  thumbnailUrl: null,
};

function stepOf(draft: CampaignDraft, slug: StepSlug) {
  const step = getCampaignStepModels(draft.serviceType).find(
    (item) => item.slug === slug,
  );
  if (!step) throw new Error(`no step ${slug}`);
  return step;
}

function isComplete(draft: CampaignDraft, slug: StepSlug) {
  return isStepComplete(stepOf(draft, slug), draft);
}

/** 1~7단계를 모두 채운 초안. 서비스·캠페인 유형별로 필요한 칸만 채움. */
function createCompleteDraft(
  serviceType: CampaignDraft["serviceType"],
  campaignType: CampaignType,
): CampaignDraft {
  const base = createDraftFixture({ serviceType });
  const isRecruit = serviceType === "RECRUIT";
  const isPurchaseReview = campaignType === "PURCHASE_REVIEW";
  const hasReward =
    isRecruit && (campaignType === "PRODUCT_DELIVERY" || isPurchaseReview);

  return createDraftFixture({
    serviceType,
    campaignInfo: {
      name: "봄 신제품 체험",
      campaignType,
      brandIdx: 3,
      startDate: "2026-12-01",
      endDate: null,
    },
    product: {
      ...base.product,
      ...(campaignType === "PRODUCT_DELIVERY" && {
        productName: "세트",
        quantityPerInfluencer: 1,
        productPrice: 45000,
      }),
      ...(campaignType === "STORE_VISIT" && {
        storeName: "빅 매장",
        storeAddress: ADDRESS,
        visitCouponCode: "1234",
        visitBenefit: "음료 1잔",
      }),
      ...(isPurchaseReview && {
        productName: "구매 제품",
        purchaseUrl: "https://shop.example.com/p/1",
        purchaseUrlVerified: true,
        purchaseGuide: "구매 안내",
        purchasePrice: isRecruit ? 30000 : null,
      }),
    },
    influencer: {
      platform: "INSTAGRAM",
      gender: "ALL",
      ageGroups: ["AGE_20S"],
      topics: ["BEAUTY"],
    },
    intro: {
      mode: "MANUAL",
      sourceUrl: null,
      mainImage: FILE,
      media: [FILE],
      description: "설명",
      notice: "유의사항",
      hashtags: ["태그"],
      aiJob: null,
    },
    conditions: {
      postingPeriodMonths: isPurchaseReview ? null : 3,
      secondaryCopyright: isPurchaseReview ? null : false,
      headcount: isRecruit ? 10 : null,
      rewardPerInfluencer: hasReward ? 1000 : null,
    },
    policy: {
      agreements: {
        service: true,
        privacy: true,
        operation: true,
        reward: true,
      },
    },
  });
}

describe("단계 정의", () => {
  it("PICK형과 모집형 모두 8단계이고 순서가 같다", () => {
    for (const serviceType of ["PICK", "RECRUIT"] as const) {
      expect(
        getCampaignStepModels(serviceType).map((step) => step.slug),
      ).toEqual([
        "campaign-info",
        "product",
        "influencer",
        "add-ons",
        "intro",
        "conditions",
        "policy",
        "payment",
      ]);
    }
  });

  it("부가서비스와 결제는 선택 단계이고 약관·결제는 수정 모드에서 잠긴다", () => {
    const steps = getCampaignStepModels("PICK");

    expect(
      steps.filter((step) => step.isOptional).map((step) => step.slug),
    ).toEqual(["add-ons", "payment"]);
    expect(
      steps.filter((step) => step.isLockedInEdit).map((step) => step.slug),
    ).toEqual(["policy", "payment"]);
  });
});

describe("모든 유형의 완성된 초안", () => {
  const cases = [
    ["PICK", "PRODUCT_DELIVERY"],
    ["PICK", "PRESS"],
    ["PICK", "STORE_VISIT"],
    ["PICK", "PURCHASE_REVIEW"],
    ["RECRUIT", "PRODUCT_DELIVERY"],
    ["RECRUIT", "PRESS"],
    ["RECRUIT", "STORE_VISIT"],
    ["RECRUIT", "PURCHASE_REVIEW"],
  ] as const;

  it.each(cases)(
    "%s형 %s는 모든 단계를 통과한다",
    (serviceType, campaignType) => {
      const draft = createCompleteDraft(serviceType, campaignType);

      expect(findFirstIncompleteStep(draft)).toBeUndefined();
    },
  );
});

describe("빈 초안", () => {
  it("필수 단계는 모두 미완이고 부가서비스·결제는 통과한다", () => {
    const draft = createDraftFixture();

    expect(isComplete(draft, "campaign-info")).toBe(false);
    expect(isComplete(draft, "product")).toBe(false);
    expect(isComplete(draft, "influencer")).toBe(false);
    expect(isComplete(draft, "intro")).toBe(false);
    expect(isComplete(draft, "policy")).toBe(false);
    expect(isComplete(draft, "add-ons")).toBe(true);
    expect(isComplete(draft, "payment")).toBe(true);
    expect(findFirstIncompleteStep(draft)?.slug).toBe("campaign-info");
  });
});

describe("1단계 캠페인 정보", () => {
  it("공백뿐인 캠페인명이나 시작일이 없으면 미완이다", () => {
    const draft = createCompleteDraft("PICK", "PRESS");

    expect(
      isComplete(
        { ...draft, campaignInfo: { ...draft.campaignInfo, name: "  " } },
        "campaign-info",
      ),
    ).toBe(false);
    expect(
      isComplete(
        { ...draft, campaignInfo: { ...draft.campaignInfo, startDate: null } },
        "campaign-info",
      ),
    ).toBe(false);
  });
});

describe("2단계 제품 정보", () => {
  it("유형을 고르지 않았으면 미완이다", () => {
    const draft = createCompleteDraft("PICK", "PRESS");

    expect(
      isComplete(
        {
          ...draft,
          campaignInfo: { ...draft.campaignInfo, campaignType: null },
        },
        "product",
      ),
    ).toBe(false);
  });

  it("제품발송형 회수 있음은 회수 주소·비용·연락처를 요구한다", () => {
    const draft = createCompleteDraft("PICK", "PRODUCT_DELIVERY");
    const withReturn = {
      ...draft,
      product: { ...draft.product, returnRequired: true },
    };

    expect(isComplete(withReturn, "product")).toBe(false);
    expect(
      isComplete(
        {
          ...withReturn,
          product: {
            ...withReturn.product,
            returnAddress: ADDRESS,
            returnShippingFee: 3000,
            returnContact: "010-1234-5678",
          },
        },
        "product",
      ),
    ).toBe(true);
  });

  it("연락처는 숫자와 하이픈만 받는다", () => {
    const draft = createCompleteDraft("PICK", "PRODUCT_DELIVERY");
    const product = {
      ...draft.product,
      returnRequired: true,
      returnAddress: ADDRESS,
      returnShippingFee: 3000,
    };

    expect(
      isComplete(
        { ...draft, product: { ...product, returnContact: "문의 주세요" } },
        "product",
      ),
    ).toBe(false);
    expect(
      isComplete(
        { ...draft, product: { ...product, returnContact: "-" } },
        "product",
      ),
    ).toBe(false);
  });

  it("대여 상품은 금액 100만원 이상과 대여 회수 정보를 요구한다", () => {
    const draft = createCompleteDraft("PICK", "PRODUCT_DELIVERY");
    const rental = {
      ...draft,
      product: { ...draft.product, rental: true, productPrice: 999_999 },
    };

    expect(isComplete(rental, "product")).toBe(false);
    expect(
      isComplete(
        {
          ...rental,
          product: {
            ...rental.product,
            productPrice: 1_000_000,
            rentalReturnAddress: ADDRESS,
            rentalReturnShippingFee: 5000,
            rentalReturnContact: "01012345678",
          },
        },
        "product",
      ),
    ).toBe(true);
  });

  it("매장방문형 방문 혜택은 300자까지다", () => {
    const draft = createCompleteDraft("PICK", "STORE_VISIT");
    const withBenefit = (visitBenefit: string) => ({
      ...draft,
      product: { ...draft.product, visitBenefit },
    });

    expect(isComplete(withBenefit("가".repeat(300)), "product")).toBe(true);
    expect(isComplete(withBenefit("가".repeat(301)), "product")).toBe(false);
  });

  it("구매리뷰형은 URL 확인을 통과해야 하고, URL을 고쳐 확인 결과가 지워지면 미완이다", () => {
    const draft = createCompleteDraft("PICK", "PURCHASE_REVIEW");

    expect(
      isComplete(
        { ...draft, product: { ...draft.product, purchaseUrlVerified: null } },
        "product",
      ),
    ).toBe(false);
    expect(
      isComplete(
        { ...draft, product: { ...draft.product, purchaseUrlVerified: false } },
        "product",
      ),
    ).toBe(false);
  });

  it("모집형 구매리뷰형만 구매제품 금액을 요구한다", () => {
    const pick = createCompleteDraft("PICK", "PURCHASE_REVIEW");
    const recruit = createCompleteDraft("RECRUIT", "PURCHASE_REVIEW");

    expect(pick.product.purchasePrice).toBeNull();
    expect(isComplete(pick, "product")).toBe(true);
    expect(
      isComplete(
        { ...recruit, product: { ...recruit.product, purchasePrice: null } },
        "product",
      ),
    ).toBe(false);
  });
});

describe("3단계 인플루언서 조건", () => {
  it("연령대와 주제는 1개 이상 골라야 한다", () => {
    const draft = createCompleteDraft("PICK", "PRESS");

    expect(
      isComplete(
        { ...draft, influencer: { ...draft.influencer, ageGroups: [] } },
        "influencer",
      ),
    ).toBe(false);
    expect(
      isComplete(
        { ...draft, influencer: { ...draft.influencer, topics: [] } },
        "influencer",
      ),
    ).toBe(false);
  });
});

describe("4단계 부가서비스", () => {
  it("PICK형은 AI 포스팅 가이드만 받는다", () => {
    const draft = createCompleteDraft("PICK", "PRESS");

    expect(
      isComplete({ ...draft, addOns: ["AI_POSTING_GUIDE"] }, "add-ons"),
    ).toBe(true);
    expect(
      isComplete({ ...draft, addOns: ["AI_MANUSCRIPT_CONFIRM"] }, "add-ons"),
    ).toBe(false);
  });

  it("모집형은 세 가지를 모두 받는다", () => {
    const draft = createCompleteDraft("RECRUIT", "PRESS");

    expect(
      isComplete(
        {
          ...draft,
          addOns: [
            "AI_POSTING_GUIDE",
            "AI_MANUSCRIPT_CONFIRM",
            "AI_RECEIPT_REVIEW",
          ],
        },
        "add-ons",
      ),
    ).toBe(true);
  });
});

describe("5단계 캠페인 소개서·모집동의서", () => {
  it("메인 이미지·상세 미디어 1~5개·설명·유의사항·해시태그가 있어야 한다", () => {
    const draft = createCompleteDraft("PICK", "PRESS");
    const withIntro = (patch: Partial<CampaignDraft["intro"]>) => ({
      ...draft,
      intro: { ...draft.intro, ...patch },
    });

    expect(isComplete(withIntro({ mainImage: null }), "intro")).toBe(false);
    expect(isComplete(withIntro({ media: [] }), "intro")).toBe(false);
    expect(isComplete(withIntro({ media: Array(6).fill(FILE) }), "intro")).toBe(
      false,
    );
    expect(isComplete(withIntro({ description: null }), "intro")).toBe(false);
    expect(isComplete(withIntro({ notice: " " }), "intro")).toBe(false);
    expect(isComplete(withIntro({ hashtags: [] }), "intro")).toBe(false);
    expect(isComplete(withIntro({ mode: null }), "intro")).toBe(false);
  });

  it("설명·유의사항은 1000자까지이고 해시태그는 중복을 받지 않는다", () => {
    const draft = createCompleteDraft("PICK", "PRESS");
    const withIntro = (patch: Partial<CampaignDraft["intro"]>) => ({
      ...draft,
      intro: { ...draft.intro, ...patch },
    });

    expect(
      isComplete(withIntro({ description: "가".repeat(1000) }), "intro"),
    ).toBe(true);
    expect(
      isComplete(withIntro({ description: "가".repeat(1001) }), "intro"),
    ).toBe(false);
    expect(isComplete(withIntro({ hashtags: ["a", "a"] }), "intro")).toBe(
      false,
    );
  });

  it("AI 생성이 진행 중이면 아직 마치지 않은 것이다", () => {
    const draft = createCompleteDraft("PICK", "PRESS");
    const generating = (status: "PENDING" | "DONE") => ({
      ...draft,
      intro: {
        ...draft.intro,
        mode: "AI" as const,
        aiJob: { jobId: "j", status },
      },
    });

    expect(isComplete(generating("PENDING"), "intro")).toBe(false);
    expect(isComplete(generating("DONE"), "intro")).toBe(true);
  });
});

describe("6단계 진행 조건", () => {
  it("PICK형 구매리뷰형은 입력할 것이 없어 바로 통과한다", () => {
    const draft = createCompleteDraft("PICK", "PURCHASE_REVIEW");

    expect(
      isComplete(
        {
          ...draft,
          conditions: {
            postingPeriodMonths: null,
            secondaryCopyright: null,
            headcount: null,
            rewardPerInfluencer: null,
          },
        },
        "conditions",
      ),
    ).toBe(true);
  });

  it("PICK형 제품발송형은 유지기간과 2차 저작권을 요구하고 리워드는 없다", () => {
    const draft = createCompleteDraft("PICK", "PRODUCT_DELIVERY");

    expect(
      isComplete(
        {
          ...draft,
          conditions: { ...draft.conditions, postingPeriodMonths: null },
        },
        "conditions",
      ),
    ).toBe(false);
    expect(
      isComplete(
        {
          ...draft,
          conditions: { ...draft.conditions, secondaryCopyright: null },
        },
        "conditions",
      ),
    ).toBe(false);
    expect(isComplete(draft, "conditions")).toBe(true);
  });

  it("모집형은 진행 인원을 1명 이상 요구한다", () => {
    const draft = createCompleteDraft("RECRUIT", "PRESS");

    expect(
      isComplete(
        { ...draft, conditions: { ...draft.conditions, headcount: 0 } },
        "conditions",
      ),
    ).toBe(false);
  });

  it("모집형 제품발송형 리워드는 1원 이상이고 협찬제품 금액을 넘을 수 없다", () => {
    const draft = createCompleteDraft("RECRUIT", "PRODUCT_DELIVERY");
    const withReward = (rewardPerInfluencer: number | null) => ({
      ...draft,
      conditions: { ...draft.conditions, rewardPerInfluencer },
    });

    expect(isComplete(withReward(null), "conditions")).toBe(false);
    expect(isComplete(withReward(0), "conditions")).toBe(false);
    expect(isComplete(withReward(45000), "conditions")).toBe(true);
    expect(isComplete(withReward(45001), "conditions")).toBe(false);
  });

  it("모집형 구매리뷰형 리워드의 상한은 구매제품 금액이고 유지기간은 받지 않는다", () => {
    const draft = createCompleteDraft("RECRUIT", "PURCHASE_REVIEW");
    const withReward = (rewardPerInfluencer: number) => ({
      ...draft,
      conditions: { ...draft.conditions, rewardPerInfluencer },
    });

    expect(isComplete(withReward(30000), "conditions")).toBe(true);
    expect(isComplete(withReward(30001), "conditions")).toBe(false);
  });

  it("모집형 기자단형·매장방문형은 리워드가 없다", () => {
    for (const campaignType of ["PRESS", "STORE_VISIT"] as const) {
      const draft = createCompleteDraft("RECRUIT", campaignType);

      expect(draft.conditions.rewardPerInfluencer).toBeNull();
      expect(isComplete(draft, "conditions")).toBe(true);
    }
  });
});

describe("7단계 정책 동의", () => {
  it("네 가지 모두 동의해야 한다", () => {
    const draft = createCompleteDraft("PICK", "PRESS");

    expect(
      isComplete(
        {
          ...draft,
          policy: { agreements: { ...draft.policy.agreements, reward: false } },
        },
        "policy",
      ),
    ).toBe(false);
  });
});

describe("findFirstIncompleteStep", () => {
  it("아직 마치지 않은 첫 필수 단계를 찾는다", () => {
    const draft = createCompleteDraft("PICK", "PRESS");

    expect(
      findFirstIncompleteStep({
        ...draft,
        influencer: { ...draft.influencer, topics: [] },
        policy: { agreements: { ...draft.policy.agreements, service: false } },
      })?.slug,
    ).toBe("influencer");
  });
});
