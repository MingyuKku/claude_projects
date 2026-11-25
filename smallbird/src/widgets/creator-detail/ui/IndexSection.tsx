import { ChevronDown, ChevronUp, ShoppingCart, Trophy } from "lucide-react";
import { useState } from "react";

import { useMatchingCategories, useCreatorTerms } from "@/entities/creator";
import { CountCard } from "@/shared/components/cards";
import { formatNumber, useTranslation } from "@/shared/i18n";
import { cn, EMPTY_VALUE } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";
import { Separator } from "@/shared/ui/separator";

import { INDEX_CARD_CLASS_NAME } from "../lib/count-card";
import { getCategoryIndexes } from "../lib/metrics";
import { MetricCard } from "./MetricCard";
import { MetricChange } from "./MetricChange";

import type { CreatorMetrics } from "@/entities/creator";

const INDEX_TERMS = {
  brandIndex: "brandInfluenceIndex",
  groupBuyIndex: "groupBuyInfluenceIndex",
} as const;

const INDEXES = [
  {
    key: "brandIndex",
    icon: Trophy,
    textClassName: "text-primary",
    barClassName: "*:data-[slot=progress-indicator]:bg-primary",
  },
  {
    key: "groupBuyIndex",
    icon: ShoppingCart,
    textClassName: "text-green-500",
    barClassName: "*:data-[slot=progress-indicator]:bg-green-500",
  },
] as const;

interface IndexSectionProps {
  metrics: CreatorMetrics;
}

// 펼침은 두 카드가 함께 움직임.
export function IndexSection({ metrics }: IndexSectionProps) {
  const { t } = useTranslation("widgets/creator-detail");
  const { term } = useCreatorTerms();
  const { allCategoryIdx } = useMatchingCategories();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <MetricCard title={t("metrics.title.index")}>
      <div className="grid grid-cols-1 items-start gap-3 tablet:grid-cols-2">
        {INDEXES.map(({ key, icon: Icon, textClassName, barClassName }) => {
          const value = metrics[key];
          const change = metrics[`${key}Change`];
          const categories = getCategoryIndexes(metrics, key, allCategoryIdx);
          const isOpen = isExpanded && categories.length > 0;

          return (
            <CountCard
              key={key}
              className={INDEX_CARD_CLASS_NAME}
              icon={<Icon className="size-4" />}
              title={term(INDEX_TERMS[key])}
              value={
                value === null
                  ? EMPTY_VALUE
                  : formatNumber(value, { maximumFractionDigits: 1 })
              }
              caption={change === null ? undefined : t("metrics.change")}
              change={
                change === null ? undefined : <MetricChange value={change} />
              }
              action={
                <div className="flex min-w-0 flex-1 flex-col ds-gap-5">
                  {isOpen && (
                    <>
                      <Separator />
                      <div className="flex flex-col ds-gap-4 pb-3">
                        <h5 className="ds-text-sm-none-medium text-muted-foreground">
                          {t("metrics.title.categoryIndex")}
                        </h5>
                        <ul className="grid grid-cols-2 gap-x-3 gap-y-2 tablet:gap-x-4 tablet:gap-y-3">
                          {categories.map((category) => {
                            const text = formatNumber(category.value, {
                              maximumFractionDigits: 1,
                            });
                            return (
                              <li
                                key={category.id}
                                className="flex min-w-0 flex-col gap-2"
                              >
                                <p className="flex justify-between gap-2">
                                  <span className="truncate ds-text-xs-5-medium text-muted-foreground">
                                    {category.name}
                                  </span>
                                  <span
                                    className={cn(
                                      "ds-text-sm-5-medium",
                                      textClassName,
                                    )}
                                  >
                                    {text}
                                  </span>
                                </p>
                                <Progress
                                  size="lg"
                                  value={category.value}
                                  aria-label={category.name}
                                  className={barClassName}
                                />
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </>
                  )}
                  <Button
                    variant="outline"
                    className="h-9.5 w-full desktop:h-10"
                    aria-expanded={isOpen}
                    disabled={categories.length === 0}
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {t("metrics.categoryDetail")}
                    {isOpen ? <ChevronUp /> : <ChevronDown />}
                  </Button>
                </div>
              }
            />
          );
        })}
      </div>
    </MetricCard>
  );
}
