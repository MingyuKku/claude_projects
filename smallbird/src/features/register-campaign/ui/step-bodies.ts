import { AddOnsNotice } from "./steps/AddOnsNotice";
import { AddOnsStep } from "./steps/AddOnsStep";
import { CampaignInfoStep } from "./steps/CampaignInfoStep";
import { ConditionsStep } from "./steps/ConditionsStep";
import { InfluencerStep } from "./steps/InfluencerStep";
import { IntroStep } from "./steps/IntroStep";
import { PaymentStep } from "./steps/PaymentStep";
import { PolicyStep } from "./steps/PolicyStep";
import { ProductPressNotice } from "./steps/product/ProductPressFields";
import { ProductStep } from "./steps/ProductStep";

import type { StepSlug } from "../model/steps";
import type { ComponentType } from "react";

/**
 * 단계 슬러그별 화면. 단계 화면을 만들 때마다 여기에 등록함(1~8단계가 모두 채워지면 단계 정의에 `Step`으로 합침).
 * 등록하지 않은 단계는 제목만 보임.
 */
export const STEP_BODIES: Partial<Record<StepSlug, ComponentType>> = {
  "campaign-info": CampaignInfoStep,
  product: ProductStep,
  influencer: InfluencerStep,
  "add-ons": AddOnsStep,
  intro: IntroStep,
  conditions: ConditionsStep,
  policy: PolicyStep,
  payment: PaymentStep,
};

/**
 * 단계 제목 위에 놓이는 안내. 단계 화면 안에서는 제목 위로 올릴 수 없어 따로 등록함.
 * 보여 줄 조건은 안내 컴포넌트가 정하고, 없으면 아무것도 그리지 않음.
 */
export const STEP_NOTICES: Partial<Record<StepSlug, ComponentType>> = {
  product: ProductPressNotice,
  "add-ons": AddOnsNotice,
};
