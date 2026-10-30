import {
  ACTIVE_PRODUCT_TYPES,
  USAGE_METRICS_BY_TYPE,
  useProductTypeLabel,
  useUsageSummary,
} from "@/entities/subscription";
import { ToggleTab } from "@/shared/components/toggle-tab";
import { useTranslation } from "@/shared/i18n";

import { UsageBreakdownCards } from "./UsageBreakdownCards";
import { UsageCountCards } from "./UsageCountCards";
import { UsageStatus } from "./UsageStatus";

import type { ActiveProductType } from "@/entities/subscription";

interface SubscriptionUsageDashboardProps {
  /** 세그먼트로 고른 상품(쿼리 `type`, 페이지가 소유). */
  type: ActiveProductType;
  onChangeType: (type: ActiveProductType) => void;
}

// 이용요약 탭: 상품 세그먼트 → 검색·제안 횟수 카드 → 이용 현황(필터·차트) → 브랜드형·공구형 카드.
export function SubscriptionUsageDashboard({
  type,
  onChangeType,
}: SubscriptionUsageDashboardProps) {
  const { t } = useTranslation("features/view-subscription-usage");
  const productLabel = useProductTypeLabel();
  const { data: summary } = useUsageSummary(type);

  return (
    <div className="flex flex-col gap-4 tablet:gap-5 desktop:gap-6">
      <ToggleTab
        aria-label={t("segment.label")}
        className="self-start max-tablet:[&>[role=radio]]:py-1"
        value={type}
        options={ACTIVE_PRODUCT_TYPES.map((value) => ({
          value,
          label: productLabel(value),
        }))}
        onValueChange={(value) => {
          const next = ACTIVE_PRODUCT_TYPES.find((item) => item === value);
          if (next) onChangeType(next);
        }}
      />
      <UsageCountCards
        search={summary.isSubscribed ? summary.search : null}
        proposal={summary.isSubscribed ? summary.proposal : null}
      />
      <UsageStatus type={type} isSubscribed={summary.isSubscribed} />
      {summary.isSubscribed && (
        <UsageBreakdownCards
          productName={productLabel(type)}
          metrics={USAGE_METRICS_BY_TYPE[type]}
          brand={summary.brand}
          groupBuy={summary.groupBuy}
        />
      )}
    </div>
  );
}
