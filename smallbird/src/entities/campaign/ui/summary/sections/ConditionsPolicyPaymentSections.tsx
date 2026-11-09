import { formatNumber, formatNumericDate, useTranslation } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";

import {
  SummaryField,
  SummaryFieldGrid,
  SummarySection,
} from "../SummarySection";

import type { CampaignDetail } from "../../../model/schema";

interface SectionProps {
  campaign: CampaignDetail;
  id: string;
}

// 6 진행 조건: 진행 인원(모집형, 구매리뷰형은 "모집 인원")·콘텐츠 유지 기간·2차 저작권·리워드(모집형 제품발송형·구매리뷰형).
// PICK형 구매리뷰형은 입력한 조건이 없어 안내만 보임.
export function ConditionsSection({ campaign, id }: SectionProps) {
  const { t } = useTranslation("entities/campaign");
  const { conditions } = campaign;
  const { campaignType } = campaign.campaignInfo;
  const isRecruit = campaign.serviceType === "RECRUIT";
  const isPurchaseReview = campaignType === "PURCHASE_REVIEW";
  const hasReward =
    isRecruit && (campaignType === "PRODUCT_DELIVERY" || isPurchaseReview);

  return (
    <SummarySection id={id} number={6} title={t("summary.conditions.title")}>
      {!isRecruit && isPurchaseReview ? (
        <SummaryField label={t("summary.conditions.none")}>-</SummaryField>
      ) : (
        // 열 방향 순서: 왼쪽 열(진행 인원·유지기간), 오른쪽 열(2차 저작권·리워드).
        <SummaryFieldGrid>
          {isRecruit && (
            <SummaryField
              label={t(
                isPurchaseReview
                  ? "summary.conditions.recruitHeadcount"
                  : "summary.conditions.headcount",
              )}
            >
              {t("summary.conditions.headcountValue", {
                count: conditions.headcount ?? 0,
              })}
            </SummaryField>
          )}
          {!isPurchaseReview && (
            <SummaryField label={t("summary.conditions.period")}>
              {conditions.postingPeriodMonths === null
                ? "-"
                : t("summary.conditions.periodValue", {
                    count: conditions.postingPeriodMonths,
                  })}
            </SummaryField>
          )}
          {!isPurchaseReview && (
            <SummaryField label={t("summary.conditions.copyright")}>
              {conditions.secondaryCopyright === null ? (
                "-"
              ) : (
                <Badge
                  variant={conditions.secondaryCopyright ? "green" : "gray"}
                  size="sm"
                >
                  {t(
                    conditions.secondaryCopyright
                      ? "summary.conditions.copyrightAllowed"
                      : "summary.conditions.copyrightDenied",
                  )}
                </Badge>
              )}
            </SummaryField>
          )}
          {hasReward && (
            <SummaryField label={t("summary.conditions.reward")}>
              {t("summary.conditions.rewardValue", {
                amount: formatNumber(conditions.rewardPerInfluencer ?? 0),
              })}
            </SummaryField>
          )}
        </SummaryFieldGrid>
      )}
    </SummarySection>
  );
}

// 7 정책 동의: 필수 4개를 모두 동의했으면 초록 배지 "전체 동의 완료".
export function PolicySection({ campaign, id }: SectionProps) {
  const { t } = useTranslation("entities/campaign");
  const isAll = Object.values(campaign.policy.agreements).every(Boolean);

  return (
    <SummarySection id={id} number={7} title={t("summary.policy.title")}>
      <SummaryField label={t("summary.policy.required")}>
        <Badge variant={isAll ? "green" : "gray"} size="sm">
          {t(isAll ? "summary.policy.all" : "summary.policy.partial")}
        </Badge>
      </SummaryField>
    </SummarySection>
  );
}

// 8 결제 정보: 결제 금액·수단·일시(날짜만).
export function PaymentSection({ campaign, id }: SectionProps) {
  const { t } = useTranslation("entities/campaign");
  const { payment } = campaign;
  const paidDate = payment ? new Date(payment.paidAt.replace(" ", "T")) : null;

  return (
    <SummarySection id={id} number={8} title={t("summary.payment.title")}>
      <SummaryFieldGrid>
        <SummaryField label={t("summary.payment.amount")}>
          {payment
            ? t("summary.won", { amount: formatNumber(payment.paidAmount) })
            : "-"}
        </SummaryField>
        <SummaryField label={t("summary.payment.paidAt")}>
          {paidDate && !Number.isNaN(paidDate.getTime())
            ? formatNumericDate(paidDate)
            : "-"}
        </SummaryField>
        <SummaryField label={t("summary.payment.method")}>
          {payment ? t("summary.payment.methodValue") : "-"}
        </SummaryField>
      </SummaryFieldGrid>
    </SummarySection>
  );
}
