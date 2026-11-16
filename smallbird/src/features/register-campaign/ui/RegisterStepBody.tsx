import { AddOnsStep } from "./steps/add-ons/AddOnsStep";
import { CampaignInfoStep } from "./steps/campaign-info/CampaignInfoStep";
import { InfluencerStep } from "./steps/influencer/InfluencerStep";
import { ProductStep } from "./steps/product/ProductStep";

import type { CampaignRegisterStep } from "@/entities/campaign";

interface RegisterStepBodyProps {
  step: CampaignRegisterStep;
}

// 단계별 입력 화면. 서비스 유형별 차이는 각 단계 화면 안에서 나눔(스펙 §4).
export function RegisterStepBody({ step }: RegisterStepBodyProps) {
  switch (step) {
    case "campaign-info":
      return <CampaignInfoStep />;
    case "product":
      return <ProductStep />;
    case "influencer":
      return <InfluencerStep />;
    case "add-ons":
      return <AddOnsStep />;
    default:
      return null;
  }
}
