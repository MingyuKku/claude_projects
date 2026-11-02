import { CircleCheck, Handshake, Mail, Users } from "lucide-react";

import { formatNumber, useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

import type { UsageBreakdown, UsageMetric } from "@/entities/subscription";
import type { LucideIcon } from "lucide-react";

const METRIC_ICONS = {
  campaignCount: Handshake,
  searchCount: Users,
  proposalCount: Mail,
  matchCount: CircleCheck,
} as const satisfies Record<UsageMetric, LucideIcon>;

interface UsageBreakdownCardsProps {
  /** 상품 이름(예: "모집형"). 카드 제목은 "{상품} 브랜드형"·"{상품} 공구형". */
  productName: string;
  /** 보여 줄 지표(PICK형은 매칭 성사 수가 더해짐). */
  metrics: readonly UsageMetric[];
  brand: UsageBreakdown;
  groupBuy: UsageBreakdown;
}

// 하단 브랜드형·공구형 표 카드. 제목 앞 색 점이 차트의 범례를 대신함(시안). PC·TAB 2열, MO 세로.
export function UsageBreakdownCards({
  productName,
  metrics,
  brand,
  groupBuy,
}: UsageBreakdownCardsProps) {
  const { t } = useTranslation("features/view-subscription-usage");

  const cards = [
    {
      id: "brand",
      dotClassName: "bg-primary",
      title: t("breakdown.brand", { product: productName }),
      values: brand,
    },
    {
      id: "groupBuy",
      dotClassName: "bg-green-500",
      title: t("breakdown.groupBuy", { product: productName }),
      values: groupBuy,
    },
  ];

  return (
    <div className="grid gap-4 tablet:grid-cols-2">
      {cards.map((card) => (
        <section
          key={card.id}
          className="overflow-hidden rounded-lg border bg-card"
        >
          <h3 className="flex items-center gap-2 px-4 py-4 text-base leading-6.5 font-semibold text-card-foreground tablet:px-5 tablet:leading-7">
            <span
              aria-hidden
              className={cn("size-3 shrink-0 rounded-full", card.dotClassName)}
            />
            {card.title}
          </h3>
          <dl className="px-4 pb-4 tablet:px-5 tablet:pb-5">
            {metrics.map((metric) => {
              const Icon = METRIC_ICONS[metric];
              return (
                <div key={metric} className="flex h-12 items-center">
                  <dt className="flex min-w-0 flex-1 items-center gap-2 pl-4 text-sm leading-5 font-semibold text-foreground">
                    <Icon aria-hidden className="size-6 shrink-0" />
                    <span className="truncate">{t(`metric.${metric}`)}</span>
                  </dt>
                  <dd className="shrink-0 pr-4 pl-2 text-right text-sm leading-5 text-foreground">
                    {t("count.value", {
                      value: formatNumber(card.values[metric] ?? 0),
                    })}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
    </div>
  );
}
