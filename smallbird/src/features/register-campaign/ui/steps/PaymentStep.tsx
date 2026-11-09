import { useTranslation } from "@/shared/i18n";

import { CampaignSummaryCard } from "./payment/CampaignSummaryCard";
import { PaymentCard } from "./payment/PaymentCard";
import { PaymentMethodCard } from "./payment/PaymentMethodCard";
import { PaymentSummaryCard } from "./payment/PaymentSummaryCard";
import { PolicyAgreementList } from "./policy/PolicyAgreementList";

// 8단계 결제(Figma 7555:334661): 카드 4개. PC는 2×2(캠페인 요약·결제 요약 / 결제 수단·약관 동의), TAB·MO는 세로 한 줄임.
// DOM 순서는 TAB·MO 시안 순서(캠페인 요약 → 결제 수단 → 결제 요약 → 약관 동의)이고, PC 위치는 grid로 지정함.
export function PaymentStep() {
  const { t } = useTranslation("features/register-campaign");

  return (
    <div className="grid grid-cols-1 gap-4 desktop:grid-cols-2 desktop:gap-6">
      <CampaignSummaryCard className="desktop:col-start-1 desktop:row-start-1" />
      <PaymentMethodCard className="desktop:col-start-1 desktop:row-start-2" />
      <PaymentSummaryCard className="desktop:col-start-2 desktop:row-start-1" />
      <PaymentCard
        title={t("payment.policy.title")}
        className="desktop:col-start-2 desktop:row-start-2"
      >
        <PolicyAgreementList idPrefix="payment" />
      </PaymentCard>
    </div>
  );
}
