import { useMemo } from "react";

import { useCampaignLabels } from "@/entities/campaign";
import { Inform } from "@/shared/components/inform";
import { formatNumber, useTranslation } from "@/shared/i18n";

import { calculatePayment } from "../../../model/calculate-payment";
import { useCampaignRegisterStore } from "../../../model/store-context";
import { PaymentCard } from "./PaymentCard";
import { SummaryRow } from "./SummaryRow";

// 결제 요약(Figma 7555:334661 우상). 금액은 `calculatePayment`가 초안 값으로 계산한 결과만 씀.
// 부가서비스 행은 고른 것만, 리워드 행은 모집형 제품발송형·구매리뷰형만 보임. 인원당 부가서비스는 "(건별 5,000원 * 모집인원 400명)"을 덧붙임.
// 부가서비스를 둘 이상 골랐을 때의 구성은 시안이 없어 항목마다 한 줄씩 보임.
export function PaymentSummaryCard({ className }: { className?: string }) {
  const { t } = useTranslation("features/register-campaign");
  const labels = useCampaignLabels();
  // 셀렉터가 매번 새 객체를 돌려주면 구독이 끝없이 갱신되므로, 초안만 구독하고 계산은 여기서 함.
  const draft = useCampaignRegisterStore((state) => state.draft);
  const summary = useMemo(() => calculatePayment(draft), [draft]);
  const won = (amount: number) =>
    t("payment.won", { amount: formatNumber(amount) });

  return (
    <PaymentCard title={t("payment.amount.title")} className={className}>
      <div className="flex flex-col">
        {summary.addOns.length > 0 && (
          <>
            <SummaryRow label={t("payment.amount.addOnProducts")}>
              {summary.addOns.map((line) => labels.addOn(line.code)).join(", ")}
            </SummaryRow>
            <SummaryRow label={t("payment.amount.addOnAmount")}>
              <span className="flex flex-col items-end">
                <span>{won(summary.addOnTotal)}</span>
                {summary.addOns
                  .filter((line) => line.unit === "PER_INFLUENCER")
                  .map((line) => (
                    <span key={line.code} className="text-xs leading-4">
                      {t("payment.amount.perInfluencer", {
                        unitPrice: formatNumber(line.unitPrice),
                        count: line.quantity,
                      })}
                    </span>
                  ))}
              </span>
            </SummaryRow>
          </>
        )}
        {summary.hasReward && (
          <SummaryRow label={t("payment.amount.reward")}>
            {won(summary.rewardTotal)}
          </SummaryRow>
        )}
        <SummaryRow label={t("payment.amount.total")} isEmphasized>
          {won(summary.total)}
        </SummaryRow>
      </div>
      <Inform
        size="sm"
        hasLineTop
        items={[{ id: "bigbird-money", text: t("payment.amount.notice") }]}
      />
    </PaymentCard>
  );
}
