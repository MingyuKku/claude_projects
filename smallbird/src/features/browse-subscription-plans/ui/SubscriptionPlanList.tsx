import { useState } from "react";

import { isBillingPeriod, SubscriptionPlanCard } from "@/entities/subscription";
import { Inform } from "@/shared/components/inform";
import { ToggleTab } from "@/shared/components/toggle-tab";
import { useTranslation } from "@/shared/i18n";

import { useEqualCollapsedHeight } from "../lib/use-equal-collapsed-height";

import type {
  ActiveProductType,
  BillingPeriod,
  Subscription,
  SubscriptionPlanCatalog,
  SubscriptionProductType,
} from "@/entities/subscription";

interface SubscriptionPlanListProps {
  catalog: SubscriptionPlanCatalog;
  /** 구독 중인 상품(해지 예정 포함). "구독 중" 표시에 씀. */
  subscriptions: Subscription[];
  /** "구독하기"를 누른 상품과 그때 고른 결제 주기. 결제 화면으로 보냄. */
  onSubscribe: (type: ActiveProductType, period: BillingPeriod) => void;
}

const NOTICE_IDS = ["1", "2"] as const;

// 구독 탭: 월간/연간 토글 + 상품 카드 목록 + 이용 안내. 상세보기는 카드마다 따로 펼침(스펙 §3).
export function SubscriptionPlanList({
  catalog,
  subscriptions,
  onSubscribe,
}: SubscriptionPlanListProps) {
  const { t } = useTranslation("features/browse-subscription-plans");
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [expanded, setExpanded] = useState<
    ReadonlySet<SubscriptionProductType>
  >(new Set());
  const cardListRef = useEqualCollapsedHeight<HTMLDivElement>(
    catalog.plans.length,
  );
  const subscribedTypes = new Set(subscriptions.map((item) => item.type));

  function toggleDetail(type: SubscriptionProductType) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  function handleChangePeriod(value: string) {
    if (isBillingPeriod(value)) setPeriod(value);
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <h2 className="text-base leading-none font-semibold">{t("title")}</h2>
        <ToggleTab
          aria-label={t("title")}
          className="w-full tablet:w-fit [&>*]:flex-1 tablet:[&>*]:flex-none"
          value={period}
          onValueChange={handleChangePeriod}
          options={[
            { value: "monthly", label: t("billing.monthly") },
            {
              value: "yearly",
              label: t("billing.yearly"),
              description: t("billing.discount", {
                rate: catalog.yearlyDiscountRate,
              }),
            },
          ]}
        />
        <div
          ref={cardListRef}
          className="grid grid-cols-1 items-start gap-5 tablet:grid-cols-2 desktop:grid-cols-4"
        >
          {catalog.plans.map((plan) => (
            <SubscriptionPlanCard
              key={plan.type}
              type={plan.type}
              isAvailable={plan.isAvailable}
              period={period}
              price={period === "yearly" ? plan.yearlyPrice : plan.monthlyPrice}
              isSubscribed={subscribedTypes.has(plan.type)}
              isExpanded={expanded.has(plan.type)}
              className="tablet:min-h-[var(--plan-card-min-height,24rem)]"
              onToggleDetail={() => toggleDetail(plan.type)}
              onSubscribe={(activeType) => onSubscribe(activeType, period)}
            />
          ))}
        </div>
      </section>
      <Inform
        variant="filled"
        title={t("notice.title")}
        items={NOTICE_IDS.map((id) => ({
          id,
          text: t(`notice.items.${id}`),
        }))}
      />
    </div>
  );
}
