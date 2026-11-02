import { CountCard } from "@/shared/components/cards";
import { formatNumber, useTranslation } from "@/shared/i18n";

import type { UsageQuota } from "@/entities/subscription";

interface UsageCountCardsProps {
  /** 구독하지 않은 상품이면 없음(값은 "-", 진행 바 0). */
  search: UsageQuota | null;
  proposal: UsageQuota | null;
}

// 검색·제안 횟수 카드. 큰 숫자는 사용 건수이고 진행 바는 사용 ÷ (사용 + 잔여). PC·TAB 2열(간격 16), MO 세로(간격 12).
export function UsageCountCards({ search, proposal }: UsageCountCardsProps) {
  const { t } = useTranslation("features/view-subscription-usage");

  function renderCard(id: "search" | "proposal", quota: UsageQuota | null) {
    const total = quota ? quota.used + quota.remaining : 0;
    const format = (value: number | null) =>
      t("count.value", { value: value === null ? "-" : formatNumber(value) });
    return (
      <CountCard
        key={id}
        title={t(`quota.${id}`)}
        value={quota ? formatNumber(quota.used) : "-"}
        unit={t("count.unit")}
        usage={{
          percent: quota && total > 0 ? (quota.used / total) * 100 : 0,
          items: [
            {
              id: "used",
              label: t("quota.used"),
              value: format(quota ? quota.used : null),
            },
            {
              id: "remaining",
              label: t("quota.remaining"),
              value: format(quota ? quota.remaining : null),
            },
          ],
        }}
      />
    );
  }

  return (
    <div className="grid gap-3 tablet:grid-cols-2 tablet:gap-4">
      {renderCard("search", search)}
      {renderCard("proposal", proposal)}
    </div>
  );
}
