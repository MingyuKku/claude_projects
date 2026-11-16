import { createEmptyDraft } from "@/entities/campaign";

import { isStepComplete } from "./step-completion";
import {
  getFirstIncompleteStep,
  getStepStatuses,
  resolveCurrentStep,
} from "./step-status";
import { getRegisterSteps } from "./steps";

import type { CampaignDraft } from "@/entities/campaign";

const steps = getRegisterSteps("PICK");

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
      value.product.quantityPerInfluencer = 1;
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
      value.influencer.platform = "INSTAGRAM";
    });
    expect(isStepComplete("intro", draft)).toBe(true);
    draft.influencer.platform = "NAVER_BLOG";
    expect(isStepComplete("intro", draft)).toBe(false);
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
      value.influencer.platform = "INSTAGRAM";
    });

    const byStep = (currentStep: "product" | "influencer") =>
      Object.fromEntries(
        getStepStatuses({
          steps,
          draft,
          currentStep,
          hasVisitedPayment: false,
        }).map((status) => [status.step, status.indicator]),
      );

    expect(byStep("product").influencer).toBe("editing");
    expect(byStep("influencer").influencer).toBeNull();
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
