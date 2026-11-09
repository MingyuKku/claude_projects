import {
  createAddOnsSchema,
  createCampaignInfoSchema,
  createConditionsSchema,
  createInfluencerSchema,
  createIntroSchema,
  createPaymentSchema,
  createPolicySchema,
  createProductSchema,
} from "./step-schemas";
import { toSection } from "./steps";

import type { StepSlug } from "./steps";
import type {
  CampaignDraft,
  CampaignSection,
  CampaignServiceType,
} from "@/entities/campaign";
import type { ZodType } from "zod";

/** 단계 정의에서 화면(컴포넌트)을 뺀 부분. 화면은 `ui`에서 붙임(`getCampaignSteps`). */
export interface CampaignStepModel {
  slug: StepSlug;
  /** 가 본 단계 목록·반려 사유에 쓰는 서버 섹션 코드. */
  section: CampaignSection;
  /** 사이드바·단계 제목·모바일 서브 헤더에 쓰는 번역 키(`features/register-campaign` namespace). */
  titleKey: StepTitleKey;
  /** 이 단계를 마쳤는지 정하는 스키마. 입력은 초안 전체이고, 서비스·캠페인 유형이나 입력값에 따라 달라지므로 초안으로 만듦. */
  createSchema: (draft: CampaignDraft) => ZodType;
  /** 선택 단계(부가서비스)·입력이 없는 단계(결제)는 비어 있어도 미완 경고를 띄우지 않음. */
  isOptional?: boolean;
  /** 반려 후 수정 모드에서 잠금(약관·결제). */
  isLockedInEdit?: boolean;
}

export type StepTitleKey =
  | "step.campaign-info.title"
  | "step.product.title"
  | "step.influencer.title"
  | "step.add-ons.title"
  | "step.intro.title"
  | "step.conditions.title"
  | "step.policy.title"
  | "step.payment.title";

function define(
  slug: StepSlug,
  titleKey: StepTitleKey,
  createSchema: CampaignStepModel["createSchema"],
  options: Pick<CampaignStepModel, "isOptional" | "isLockedInEdit"> = {},
): CampaignStepModel {
  return { slug, section: toSection(slug), titleKey, createSchema, ...options };
}

// PICK형 브랜드형과 모집형 브랜드형이 같은 8단계 구조를 씀. 서비스 유형별 차이는 스키마와 단계 컴포넌트 안의 분기로만 둠.
// 5단계 이름은 두 유형 모두 "캠페인 소개서 작성"이고, 모집형은 소개서 바로 다음에 "모집동의서" 단계가 따로 생길 예정(시안 대기, 스펙 P-21).
// 공구형이 추가되면 서비스 유형별 배열을 늘리고, 마법사 골격·주소·저장은 그대로 씀.
function createBrandSteps(): CampaignStepModel[] {
  return [
    define(
      "campaign-info",
      "step.campaign-info.title",
      createCampaignInfoSchema,
    ),
    define("product", "step.product.title", createProductSchema),
    define("influencer", "step.influencer.title", createInfluencerSchema),
    define("add-ons", "step.add-ons.title", createAddOnsSchema, {
      isOptional: true,
    }),
    define("intro", "step.intro.title", createIntroSchema),
    define("conditions", "step.conditions.title", createConditionsSchema),
    define("policy", "step.policy.title", createPolicySchema, {
      isLockedInEdit: true,
    }),
    define("payment", "step.payment.title", createPaymentSchema, {
      isOptional: true,
      isLockedInEdit: true,
    }),
  ];
}

const STEPS_BY_SERVICE_TYPE: Record<CampaignServiceType, CampaignStepModel[]> =
  {
    PICK: createBrandSteps(),
    RECRUIT: createBrandSteps(),
  };

export function getCampaignStepModels(serviceType: CampaignServiceType) {
  return STEPS_BY_SERVICE_TYPE[serviceType];
}

/** 이 단계의 필수 입력을 다 채웠는가. 선택 단계는 늘 true. */
export function isStepComplete(step: CampaignStepModel, draft: CampaignDraft) {
  return step.createSchema(draft).safeParse(draft).success;
}

/** 아직 마치지 않은 첫 단계. 모두 마쳤으면 undefined. 주소의 `step`이 없거나 잘못됐을 때, 결제하기가 미완 단계로 보낼 때 씀. */
export function findFirstIncompleteStep(draft: CampaignDraft) {
  return getCampaignStepModels(draft.serviceType).find(
    (step) => !step.isOptional && !isStepComplete(step, draft),
  );
}
