import { AddOnsStep } from "./steps/add-ons/AddOnsStep";
import { CampaignInfoStep } from "./steps/campaign-info/CampaignInfoStep";
import { ConditionsStep } from "./steps/conditions/ConditionsStep";
import { CreatorStep } from "./steps/creator/CreatorStep";
import { GroupBuyStep } from "./steps/group-buy/GroupBuyStep";
import { IntroStep } from "./steps/intro/IntroStep";
import { PaymentStep } from "./steps/payment/PaymentStep";
import { PolicyStep } from "./steps/policy/PolicyStep";
import { ProductStep } from "./steps/product/ProductStep";

import type { CampaignRegisterStep } from "@/entities/campaign";
import type { ReactNode } from "react";

interface RegisterStepBodyProps {
  step: CampaignRegisterStep;
  chargeSlot?: ReactNode;
}

// 단계별 입력 화면. 서비스 유형별 차이는 각 단계 화면 안에서 나눔(스펙 §4).
export function RegisterStepBody({ step, chargeSlot }: RegisterStepBodyProps) {
  switch (step) {
    case "campaign-info":
      return <CampaignInfoStep />;
    case "product":
      return <ProductStep />;
    case "creator":
      return <CreatorStep />;
    case "group-buy":
      return <GroupBuyStep />;
    case "add-ons":
      return <AddOnsStep />;
    case "intro":
      return <IntroStep />;
    case "conditions":
      return <ConditionsStep />;
    case "policy":
      return <PolicyStep />;
    case "payment":
      return <PaymentStep chargeSlot={chargeSlot} />;
    default:
      return null;
  }
}
