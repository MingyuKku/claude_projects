import { useCreatorTerms } from "@/entities/creator";
import { ChartLine, ChartRadar } from "@/shared/components/charts";
import { formatNumber, useTranslation } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";

import { getFollowerTrend, getShortMonth } from "../lib/metrics";
import { MetricCard, MetricComingSoon, MetricEmpty } from "./MetricCard";

import type { CreatorMetrics } from "@/entities/creator";

// 서버가 주는 축 순서.
const AXES = ["reach", "like", "share", "view", "reply"] as const;
const AXIS_TERMS = {
  like: "avgLikeCount",
  share: "avgShareRatio",
  view: "avgViewCount",
  reply: "avgCommentCount",
} as const;
const HIGHLIGHT_RANK = 3;

interface ActivitySectionProps {
  metrics: CreatorMetrics;
}

export function ActivitySection({ metrics }: ActivitySectionProps) {
  const { t } = useTranslation("widgets/creator-detail");
  const { term } = useCreatorTerms();

  function getAxisLabel(axis: (typeof AXES)[number]) {
    return axis === "reach" ? t("metrics.axis.reach") : term(AXIS_TERMS[axis]);
  }

  const trend = getFollowerTrend(metrics);
  const hasActivityIndex = metrics.activityIndex.some(
    (axis) => axis.value !== null,
  );

  return (
    <section className="flex flex-col gap-3 tablet:gap-4">
      <h3 className="ds-text-sm-none-semibold text-foreground">
        {t("metrics.title.activity")}
      </h3>
      <div className="grid grid-cols-1 gap-3 tablet:gap-4 desktop:grid-cols-[298fr_322fr_298fr] desktop:*:min-h-88.5">
        <MetricCard title={t("metrics.title.followerMix")}>
          <MetricComingSoon />
        </MetricCard>
        <MetricCard title={t("metrics.title.activityIndex")}>
          {hasActivityIndex ? (
            <div className="flex min-h-73 flex-1 items-center justify-center">
              <ChartRadar
                data={AXES.map((axis, index) => ({
                  id: axis,
                  label: getAxisLabel(axis),
                  value: metrics.activityIndex[index]?.value ?? 0,
                }))}
              />
            </div>
          ) : (
            <MetricEmpty />
          )}
        </MetricCard>
        <MetricCard title={t("metrics.title.demographic")}>
          <MetricComingSoon />
        </MetricCard>
      </div>
      <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2 tablet:gap-4 tablet:*:min-h-57.5">
        <MetricCard title={t("metrics.title.trend")}>
          {trend.length > 0 ? (
            <ChartLine
              data={trend}
              xKey="yearMonth"
              formatXTick={getShortMonth}
              series={[
                {
                  key: "followerCount",
                  label: term("followerCount"),
                },
              ]}
              className="pl-5"
            />
          ) : (
            <MetricEmpty />
          )}
        </MetricCard>
        <MetricCard title={t("metrics.title.topCommenters")}>
          {metrics.topCommenters.length > 0 ? (
            <ol className="relative grid grid-flow-col grid-cols-2 grid-rows-5 gap-x-8 gap-y-2 py-3 before:absolute before:inset-y-3 before:left-1/2 before:border-l before:border-border tablet:gap-y-3">
              {metrics.topCommenters.map((commenter) => (
                <li
                  key={commenter.rank}
                  className="flex min-w-0 items-center gap-1.5"
                >
                  <Badge
                    variant={commenter.rank <= HIGHLIGHT_RANK ? "blue" : "gray"}
                    size="sm"
                    className="w-5 px-0 max-tablet:leading-4"
                  >
                    {commenter.rank}
                  </Badge>
                  <span className="min-w-0 flex-1 truncate ds-text-xs-4-normal text-muted-foreground">
                    {commenter.nickname}
                  </span>
                  <span className="ds-text-xs-4-normal text-muted-foreground">
                    {t("metrics.commentCount", {
                      value: formatNumber(commenter.commentCount),
                    })}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <MetricEmpty />
          )}
        </MetricCard>
      </div>
    </section>
  );
}
