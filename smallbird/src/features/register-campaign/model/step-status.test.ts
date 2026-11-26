import { createEmptyDraft } from "@/entities/campaign";

import { applyDraftDefaults } from "./draft-defaults";
import { isStepComplete, isStepStarted } from "./step-completion";
import {
  getFirstIncompleteStep,
  getStepStatuses,
  resolveCurrentStep,
} from "./step-status";
import { getRegisterSteps } from "./steps";

import type { CampaignDraft } from "@/entities/campaign";

const steps = getRegisterSteps("PICK", "BRAND");

function draftWithInfo(patch?: (draft: CampaignDraft) => void) {
  const draft = createEmptyDraft();
  draft.info = {
    name: "봄 체험단",
    brandIdx: 1,
    campaignType: "PRODUCT_DELIVERY",
    startDate: "2026-12-01",
  };
  patch?.(draft);
  return draft;
}

describe("단계 필수값", () => {
  it("1단계는 캠페인명·유형·브랜드·시작일이 모두 있어야 한다", () => {
    expect(isStepComplete("info", createEmptyDraft())).toBe(false);
    expect(isStepComplete("info", draftWithInfo())).toBe(true);
    expect(
      isStepComplete(
        "info",
        draftWithInfo((draft) => {
          draft.info.name = "  ";
        }),
      ),
    ).toBe(false);
  });

  it("제품발송형은 반품 회수 있음이면 회수 칸, 대여 상품이면 100만원 이상 금액과 대여 회수 칸이 필요하다", () => {
    const draft = draftWithInfo((value) => {
      value.product.productName = "앰플";
      value.product.quantityPerCreator = 1;
      value.product.productPrice = 45000;
    });
    expect(isStepComplete("product", draft)).toBe(true);

    draft.product.returnRequired = true;
    expect(isStepComplete("product", draft)).toBe(false);
    draft.product.returnAddress = {
      zonecode: "06236",
      address: "서울",
      detail: "",
    };
    draft.product.returnShippingFee = 3000;
    draft.product.returnContact = "010-1234-5678";
    expect(isStepComplete("product", draft)).toBe(true);

    draft.product.rental = true;
    draft.product.rentalReturnAddress = draft.product.returnAddress;
    draft.product.rentalReturnShippingFee = 3000;
    draft.product.rentalReturnContact = "02-123-4567";
    expect(isStepComplete("product", draft)).toBe(false);
    draft.product.productPrice = 1_000_000;
    expect(isStepComplete("product", draft)).toBe(true);
  });

  it("매장방문형 쿠폰 인증번호는 숫자 4자리이고 첫 자리 0은 안 된다", () => {
    const draft = draftWithInfo((value) => {
      value.info.campaignType = "STORE_VISIT";
      value.product.storeName = "강남점";
      value.product.storeAddress = {
        zonecode: "06236",
        address: "서울",
        detail: "",
      };
      value.product.visitBenefit = "음료 1잔";
      value.product.visitCouponCode = "0123";
    });
    expect(isStepComplete("product", draft)).toBe(false);
    draft.product.visitCouponCode = "1234";
    expect(isStepComplete("product", draft)).toBe(true);
  });

  it("기자단형 제품 정보와 부가서비스는 비어 있어도 통과한다", () => {
    const press = draftWithInfo((draft) => {
      draft.info.campaignType = "PRESS";
    });
    expect(isStepComplete("product", press)).toBe(true);
    expect(isStepComplete("addOns", press)).toBe(true);
  });

  it("소개서는 블로그·유튜브면 제목 해시태그도 필요하다", () => {
    const draft = draftWithInfo((value) => {
      value.intro = {
        mainImage: { attachmentIdx: 1, url: "a", mediaType: "IMAGE" },
        detailMedia: [{ attachmentIdx: 2, url: "b", mediaType: "IMAGE" }],
        description: "설명",
        notice: "유의사항",
        titleHashtags: [],
        contentHashtags: ["협찬"],
      };
      value.creator.platform = "INSTAGRAM";
    });
    expect(isStepComplete("intro", draft)).toBe(true);
    draft.creator.platform = "NAVER_BLOG";
    expect(isStepComplete("intro", draft)).toBe(false);
  });

  it("소개서의 상품 상세 이미지/동영상은 1개 이상이어야 통과한다", () => {
    const draft = draftWithInfo((value) => {
      value.intro = {
        mainImage: { attachmentIdx: 1, url: "a", mediaType: "IMAGE" },
        detailMedia: [],
        description: "설명",
        notice: "유의사항",
        titleHashtags: [],
        contentHashtags: ["협찬"],
      };
      value.creator.platform = "INSTAGRAM";
    });
    expect(isStepComplete("intro", draft)).toBe(false);
    draft.intro.detailMedia = [
      { attachmentIdx: 2, url: "b", mediaType: "VIDEO" },
    ];
    expect(isStepComplete("intro", draft)).toBe(true);
  });

  it("진행 조건 유지기간은 1~999개월 정수다", () => {
    const draft = draftWithInfo((value) => {
      value.conditions.secondaryCopyright = false;
      value.conditions.postingPeriodMonths = 1000;
    });
    expect(isStepComplete("conditions", draft)).toBe(false);
    draft.conditions.postingPeriodMonths = 999;
    expect(isStepComplete("conditions", draft)).toBe(true);
  });
});

describe("사이드바 단계 상태", () => {
  it("1단계를 통과하기 전에는 2~8단계가 비활성이다", () => {
    const statuses = getStepStatuses({
      steps,
      draft: createEmptyDraft(),
      currentStep: "campaign-info",
      hasVisitedPayment: false,
    });

    expect(statuses.map((status) => status.state)).toEqual([
      "current",
      ...Array(7).fill("disabled"),
    ]);
  });

  it("현재 단계가 아닌 일부만 입력한 단계에 입력 중 표시를 한다", () => {
    const draft = draftWithInfo((value) => {
      value.creator.platform = "INSTAGRAM";
    });

    const byStep = (currentStep: "product" | "creator") =>
      Object.fromEntries(
        getStepStatuses({
          steps,
          draft,
          currentStep,
          hasVisitedPayment: false,
        }).map((status) => [status.step, status.indicator]),
      );

    expect(byStep("product").creator).toBe("editing");
    expect(byStep("creator").creator).toBeNull();
    expect(byStep("product").product).toBeNull();
  });

  it("결제 단계에 들어온 뒤에는 필수값이 빠진 단계에 경고하고 선택 단계는 빼며, 채우면 풀린다", () => {
    const draft = draftWithInfo();
    const statuses = getStepStatuses({
      steps,
      draft,
      currentStep: "payment",
      hasVisitedPayment: true,
    });
    const indicators = Object.fromEntries(
      statuses.map((status) => [status.step, status.indicator]),
    );

    expect(indicators).toMatchObject({
      "campaign-info": null,
      product: "warning",
      "add-ons": null,
      policy: "warning",
      payment: null,
    });
  });
});

describe("입력 시작 판정", () => {
  it("기본 선택만 있는 단계는 입력을 시작하지 않은 것으로 본다", () => {
    const draft = applyDraftDefaults(createEmptyDraft());

    expect(isStepStarted("creator", draft)).toBe(false);
  });

  it("기본 선택과 다른 값을 고르면 입력을 시작한 것이다", () => {
    const draft = applyDraftDefaults(createEmptyDraft());
    draft.creator.ageGroups = ["AGE_20S"];

    expect(isStepStarted("creator", draft)).toBe(true);
  });
});

describe("열 단계 정하기", () => {
  it("1단계를 통과하지 않았으면 주소와 관계없이 1단계다", () => {
    expect(
      resolveCurrentStep({
        requested: "payment",
        steps,
        draft: createEmptyDraft(),
      }),
    ).toBe("campaign-info");
  });

  it("주소에 단계가 없으면 아직 끝내지 않은 첫 필수 단계, 모두 끝났으면 결제다", () => {
    const draft = draftWithInfo();
    expect(resolveCurrentStep({ requested: null, steps, draft })).toBe(
      "product",
    );
    expect(resolveCurrentStep({ requested: "intro", steps, draft })).toBe(
      "intro",
    );

    const allDone = createEmptyDraft();
    expect(getFirstIncompleteStep([], allDone)).toBe("payment");
  });
});

describe("공구형 단계 구성", () => {
  const groupBuySteps = getRegisterSteps("PICK", "GROUP_BUY");

  it("진행 조건이 없고 공동구매 조건이 4번, 부가서비스가 6번이다", () => {
    expect(groupBuySteps.map(({ step }) => step)).toEqual([
      "campaign-info",
      "product",
      "creator",
      "group-buy",
      "intro",
      "add-ons",
      "policy",
      "payment",
    ]);
  });

  it("브랜드형은 진행 조건이 4번, 부가서비스가 6번이다", () => {
    expect(steps.map(({ step }) => step)).toEqual([
      "campaign-info",
      "product",
      "creator",
      "conditions",
      "intro",
      "add-ons",
      "policy",
      "payment",
    ]);
  });

  it("공동구매 조건은 제품명·대분류·중분류·권장소비자가·공동구매가(1원 이상)가 모두 있어야 끝난다", () => {
    const draft = createEmptyDraft();
    const complete = {
      productName: "숙박권",
      categoryIdx: 8,
      middleCategoryIdx: 36,
      recommendedPrice: 60000,
      price: 45000,
    };
    expect(isStepComplete("groupBuy", draft)).toBe(false);

    draft.groupBuy = { ...complete };
    expect(isStepComplete("groupBuy", draft)).toBe(true);

    for (const patch of [
      { productName: "  " },
      { middleCategoryIdx: null },
      { recommendedPrice: null },
      { recommendedPrice: 0 },
      { price: 0 },
    ]) {
      draft.groupBuy = { ...complete, ...patch };
      expect(isStepComplete("groupBuy", draft)).toBe(false);
    }
  });

  it("첫 미완 단계는 공구형 순서로 찾고, 진행 조건은 건너뛴다", () => {
    const draft = draftWithInfo();
    draft.product = {
      ...draft.product,
      productName: "숙박권",
      quantityPerCreator: 1,
      productPrice: 30000,
    };
    draft.creator = {
      platform: "INSTAGRAM",
      gender: "FEMALE",
      ageGroups: ["AGE_20S"],
      topics: ["Beauty"],
    };

    expect(getFirstIncompleteStep(groupBuySteps, draft)).toBe("group-buy");
  });
});
