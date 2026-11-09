import { useCampaignLabels } from "@/entities/campaign";
import { formatNumber, formatNumericDate, useTranslation } from "@/shared/i18n";
import { fromIsoDate } from "@/shared/lib";

import {
  calculateEndDate,
  CAMPAIGN_PERIOD_DAYS,
} from "../../../lib/campaign-period";
import { useCampaignRegisterStore } from "../../../model/store-context";
import { PaymentCard } from "./PaymentCard";
import { SummaryRow } from "./SummaryRow";

function formatDate(value: string | null) {
  const date = fromIsoDate(value);
  return date ? formatNumericDate(date) : null;
}

// 캠페인 요약(Figma 7555:334661 좌상). 초안 값을 그대로 보임.
// 리워드 행은 제품발송형만("제품 제공 (n원 상당)", n = 협찬제품 금액 × 1인당 수량, 스펙 P-2), 진행 인원 행은 모집형만 있음.
// 시안의 서비스/캠페인 유형 값 뒤바뀜과 "4,5000원" 자릿수 오타는 따르지 않음.
export function CampaignSummaryCard({ className }: { className?: string }) {
  const { t } = useTranslation("features/register-campaign");
  const labels = useCampaignLabels();
  const draft = useCampaignRegisterStore((state) => state.draft);
  const { campaignType, startDate, endDate } = draft.campaignInfo;
  const isRecruit = draft.serviceType === "RECRUIT";
  const isPurchaseReview = campaignType === "PURCHASE_REVIEW";

  const start = formatDate(startDate);
  const end = formatDate(endDate ?? calculateEndDate(startDate));
  const rewardAmount =
    (draft.product.productPrice ?? 0) *
    (draft.product.quantityPerInfluencer ?? 0);

  return (
    <PaymentCard title={t("payment.summary.title")} className={className}>
      <div className="flex flex-col">
        <SummaryRow label={t("payment.summary.serviceType")}>
          {labels.serviceProduct(draft.serviceType, draft.productType)}
        </SummaryRow>
        <SummaryRow label={t("payment.summary.campaignType")}>
          {campaignType ? labels.campaignType(campaignType) : "-"}
        </SummaryRow>
        {isRecruit && (
          <SummaryRow
            label={t(
              isPurchaseReview
                ? "conditions.headcount.recruitLabel"
                : "conditions.headcount.label",
            )}
          >
            {t("payment.summary.headcount", {
              count: draft.conditions.headcount ?? 0,
            })}
          </SummaryRow>
        )}
        {campaignType === "PRODUCT_DELIVERY" && (
          <SummaryRow label={t("payment.summary.reward")}>
            {t("payment.summary.rewardProduct", {
              amount: formatNumber(rewardAmount),
            })}
          </SummaryRow>
        )}
        <SummaryRow label={t("payment.summary.period")}>
          {start && end
            ? t("payment.summary.periodValue", {
                start,
                end,
                days: CAMPAIGN_PERIOD_DAYS,
              })
            : "-"}
        </SummaryRow>
      </div>
    </PaymentCard>
  );
}
