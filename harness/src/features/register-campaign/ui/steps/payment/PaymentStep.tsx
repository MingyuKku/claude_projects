import { BalanceCard, useBigbirdMoneyBalance } from "@/entities/bigbird-money";
import {
  CAMPAIGN_PERIOD_DAYS,
  getCampaignEndDate,
  toCampaignTypeFilter,
  useCampaignTypeLabel,
} from "@/entities/campaign";
import { Inform } from "@/shared/components/inform";
import { formatNumber, formatNumericDate, useTranslation } from "@/shared/i18n";
import { fromIsoDate } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";

import { CAMPAIGN_TYPE_LABEL_KEYS } from "../../../model/campaign-type-labels";
import { calculateDraftPayment } from "../../../model/payment";
import { CHARGE_AREA_ID } from "../../../model/use-payment-flow";
import { useRegisterWizardStore } from "../../../model/wizard-context";
import { PolicyAgreementList } from "../policy/PolicyStep";

import type { ReactNode } from "react";

interface PaymentStepProps {
  /** 충전 입력. feature끼리 가져올 수 없어 페이지가 채움. */
  chargeSlot?: ReactNode;
}

export function PaymentStep({ chargeSlot }: PaymentStepProps) {
  const isDemo = useRegisterWizardStore((state) => state.isDemo);

  if (isDemo) {
    return (
      <div className="grid ds-gap-5 desktop:grid-cols-2">
        <CampaignSummaryCard />
        <PaymentSummaryCard />
      </div>
    );
  }

  return (
    <div className="grid ds-gap-5 desktop:grid-cols-2">
      <CampaignSummaryCard />
      <PaymentSummaryCard className="order-3 desktop:order-0" />
      <PaymentMethodCard
        chargeSlot={chargeSlot}
        className="order-2 desktop:order-0"
      />
      <PaymentCard title="terms" className="order-4 desktop:order-0">
        <div className="ds-px-6 ds-pb-6">
          <PolicyAgreementList />
        </div>
      </PaymentCard>
    </div>
  );
}

interface PaymentCardProps {
  title: "campaignSummary" | "paymentSummary" | "method" | "terms";
  className?: string;
  children: ReactNode;
}

function PaymentCard({ title, className, children }: PaymentCardProps) {
  const { t } = useTranslation("features/register-campaign");

  return (
    <section
      className={cn(
        "flex min-w-0 flex-col rounded-lg border bg-card",
        className,
      )}
    >
      <h3 className="px-5 py-4 ds-text-base-7-semibold">
        {t(`payment.${title}.title`)}
      </h3>
      {children}
    </section>
  );
}

interface SummaryRowProps {
  label: string;
  children: ReactNode;
  isEmphasized?: boolean;
}

function SummaryRow({ label, children, isEmphasized }: SummaryRowProps) {
  return (
    <div
      className={cn(
        "flex min-h-12 items-center justify-between gap-4 px-4",
        isEmphasized ? "ds-text-base-7-semibold" : "ds-text-sm-5-normal",
      )}
    >
      <dt className={cn("shrink-0", !isEmphasized && "font-semibold")}>
        {label}
      </dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}

function CampaignSummaryCard() {
  const { t } = useTranslation("features/register-campaign");
  const typeLabel = useCampaignTypeLabel();
  const serviceType = useRegisterWizardStore((state) => state.serviceType);
  const productType = useRegisterWizardStore((state) => state.productType);
  const info = useRegisterWizardStore((state) => state.draft.info);
  const productPrice = useRegisterWizardStore(
    (state) => state.draft.product.productPrice,
  );

  const typeFilter = toCampaignTypeFilter(serviceType, productType);
  const startDate = fromIsoDate(info.startDate);
  const endDate = fromIsoDate(getCampaignEndDate(info.startDate));
  const hasReward = info.campaignType === "PRODUCT_DELIVERY";

  return (
    <PaymentCard title="campaignSummary">
      <dl className="flex flex-col ds-px-5 ds-pb-5">
        <SummaryRow label={t("payment.campaignSummary.serviceType")}>
          {typeFilter ? typeLabel(typeFilter) : "-"}
        </SummaryRow>
        <SummaryRow label={t("payment.campaignSummary.campaignType")}>
          {info.campaignType
            ? t(CAMPAIGN_TYPE_LABEL_KEYS[info.campaignType])
            : "-"}
        </SummaryRow>
        {hasReward && (
          // PICK형 리워드는 결제 금액이 아니라 제품 1개당 금액 표시.
          <SummaryRow label={t("payment.campaignSummary.reward")}>
            {productPrice === null
              ? "-"
              : t("payment.campaignSummary.rewardValue", {
                  amount: formatNumber(productPrice),
                })}
          </SummaryRow>
        )}
        <SummaryRow label={t("payment.campaignSummary.period")}>
          {startDate && endDate
            ? t("payment.campaignSummary.periodValue", {
                start: formatNumericDate(startDate),
                end: formatNumericDate(endDate),
                days: CAMPAIGN_PERIOD_DAYS,
              })
            : "-"}
        </SummaryRow>
      </dl>
    </PaymentCard>
  );
}

function PaymentSummaryCard({ className }: { className?: string }) {
  const { t } = useTranslation("features/register-campaign");
  const serviceType = useRegisterWizardStore((state) => state.serviceType);
  const draft = useRegisterWizardStore((state) => state.draft);
  const isDemo = useRegisterWizardStore((state) => state.isDemo);

  const { addOnItems, totalAmount } = calculateDraftPayment(serviceType, draft);
  const addOnAmount = addOnItems.reduce((sum, item) => sum + item.amount, 0);
  const won = (amount: number) =>
    t("payment.won", { amount: formatNumber(amount) });

  return (
    <PaymentCard title="paymentSummary" className={className}>
      <div className="flex flex-col gap-1.5 ds-px-5 pb-3">
        <dl className="flex flex-col">
          <SummaryRow label={t("payment.paymentSummary.addOnItems")}>
            {addOnItems.length > 0
              ? addOnItems
                  .map(({ addOn }) => t(`addOns.${addOn}.name`))
                  .join(", ")
              : "-"}
          </SummaryRow>
          <SummaryRow label={t("payment.paymentSummary.addOnAmount")}>
            {won(addOnAmount)}
          </SummaryRow>
          <SummaryRow label={t("payment.paymentSummary.total")} isEmphasized>
            {won(totalAmount)}
          </SummaryRow>
        </dl>
        <Inform
          hasLineTop
          items={[
            {
              id: "notice",
              text: t(
                isDemo
                  ? "payment.paymentSummary.demoNotice"
                  : "payment.paymentSummary.notice",
              ),
            },
          ]}
        />
      </div>
    </PaymentCard>
  );
}

interface PaymentMethodCardProps {
  chargeSlot?: ReactNode;
  className?: string;
}

function PaymentMethodCard({ chargeSlot, className }: PaymentMethodCardProps) {
  const { t } = useTranslation("features/register-campaign");
  const { balance } = useBigbirdMoneyBalance();

  return (
    <PaymentCard title="method" className={className}>
      <p className="flex items-center gap-2 px-5 py-4">
        {/* 결제 수단이 하나뿐이라 고를 수 없는 선택 표시. */}
        <span
          aria-hidden
          className="flex size-4 items-center justify-center rounded-full border border-primary"
        >
          <span className="size-2 rounded-full bg-primary" />
        </span>
        <span className="ds-text-base-7-semibold">
          {t("payment.method.bigbirdMoney")}
        </span>
        <Badge size="sm">{t("payment.method.required")}</Badge>
      </p>
      <div className="flex flex-col gap-4 ds-px-5 ds-pb-5">
        <BalanceCard amount={balance?.amount} titleAs="h3" />
        <div id={CHARGE_AREA_ID}>{chargeSlot}</div>
      </div>
    </PaymentCard>
  );
}
