import { useState } from "react";

import {
  getSubscribedTypes,
  isBillingPeriod,
  SubscriptionPlanCard,
} from "@/entities/subscription";
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

// 구독 탭: 월간/연간 토글 + 상품 카드 목록. 상세보기는 카드마다 따로 펼침(스펙 §3).
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
  const cardListRef = useEqualCollapsedHeight<HTMLDivElement>();
  const subscribedTypes = getSubscribedTypes(subscriptions);

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
    <section className="flex flex-col gap-4">
      <h2 className="text-base leading-none font-semibold">{t("title")}</h2>
      {/* 스크롤해도 페이지의 고정 탭 줄(--sticky-tab-bar-height) 아래에 붙음. 토글 위에만 8px 여백이 있고(-mt-2가 pt-2를 되돌려 평상시 간격은 그대로),
          아래 띠는 두지 않음. 양옆은 화면 여백(--mypage-gutter) 끝까지 배경으로 덮음: 카드의 테두리·링(구독 중 카드의 box-shadow 1px)이
          카드 바깥으로 나와 토글 양끝에 비치지 않게 함. z-10은 탭 본문(isolate) 안에서 카드보다 위에 그리기 위함. */}
      <div className="sticky top-(--sticky-tab-bar-height) z-10 -mx-(--mypage-gutter) -mt-2 bg-background px-(--mypage-gutter) pt-2">
        <ToggleTab
          aria-label={t("title")}
          className="w-full *:flex-1 tablet:w-fit tablet:*:flex-none"
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
      </div>
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
            monthlyPrice={plan.monthlyPrice}
            yearlyPrice={plan.yearlyPrice}
            isSubscribed={subscribedTypes.has(plan.type)}
            isExpanded={expanded.has(plan.type)}
            className="tablet:min-h-(--plan-card-min-height,24rem)"
            onToggleDetail={() => toggleDetail(plan.type)}
            onSubscribe={(activeType) => onSubscribe(activeType, period)}
          />
        ))}
      </div>
    </section>
  );
}
