import {
  LoadError,
  useCreatorMetrics,
  useCreatorTerms,
} from "@/entities/creator";
import { CountCard } from "@/shared/components/cards";
import { formatNumber, useTranslation } from "@/shared/i18n";
import { EMPTY_VALUE } from "@/shared/lib";
import { Skeleton } from "@/shared/ui/skeleton";

import { COUNT_CARD_CLASS_NAME } from "../lib/count-card";
import { ActivitySection } from "./ActivitySection";
import { IndexSection } from "./IndexSection";
import { MetricCard, MetricComingSoon } from "./MetricCard";
import { MetricChange } from "./MetricChange";

import type { CreatorDetailTarget } from "@/entities/creator";

const COUNT_KEYS = [
  "followerCount",
  "avgViewCount",
  "avgLikeCount",
  "avgCommentCount",
  "avgShareRatio",
  "avgCommentWriterCount",
] as const;
const COST_KEYS = ["expectedCost", "desiredCost"] as const;

interface MetricsTabProps {
  target: CreatorDetailTarget;
}

export function MetricsTab({ target }: MetricsTabProps) {
  const { t } = useTranslation("widgets/creator-detail");
  const { term } = useCreatorTerms();
  const { t: tCommon } = useTranslation();
  const { metrics, isLoading, isError, reload } = useCreatorMetrics(target);

  if (isError) return <LoadError onClickRetry={() => void reload()} />;

  if (isLoading || !metrics) {
    return (
      <div
        role="status"
        aria-label={tCommon("status.loading")}
        className="grid grid-cols-2 gap-3 tablet:grid-cols-4 tablet:gap-4"
      >
        {[...COUNT_KEYS, ...COST_KEYS].map((key) => (
          <Skeleton key={key} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  function formatCount(value: number | null) {
    return value === null
      ? EMPTY_VALUE
      : formatNumber(value, { maximumFractionDigits: 1 });
  }

  return (
    <div className="flex flex-col ds-gap-6">
      <section className="flex flex-col gap-3 tablet:gap-4">
        <h3 className="ds-text-sm-none-semibold text-foreground">
          {t("metrics.title.performance")}
        </h3>
        <div className="grid grid-cols-2 gap-3 tablet:grid-cols-4 tablet:gap-4">
          {COUNT_KEYS.map((key) => {
            const change = metrics[`${key}Change`];
            return (
              <CountCard
                key={key}
                className={COUNT_CARD_CLASS_NAME}
                title={term(key)}
                value={formatCount(metrics[key])}
                caption={change === null ? undefined : t("metrics.change")}
                change={
                  change === null ? undefined : <MetricChange value={change} />
                }
              />
            );
          })}
          {COST_KEYS.map((key) => (
            <CountCard
              key={key}
              className={COUNT_CARD_CLASS_NAME}
              title={term(key)}
              value={formatCount(metrics[key])}
              unit={metrics[key] === null ? undefined : term("won")}
            />
          ))}
        </div>
        <IndexSection metrics={metrics} />
        <MetricCard title={t("metrics.title.follower")}>
          <MetricComingSoon />
        </MetricCard>
      </section>
      <ActivitySection metrics={metrics} />
    </div>
  );
}
