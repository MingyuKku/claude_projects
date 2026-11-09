import { useId, useState } from "react";

import { USAGE_METRICS_BY_TYPE, useUsageSeries } from "@/entities/subscription";
import { EmptyState } from "@/shared/components/empty-state";
import { OptionSelect } from "@/shared/components/option-select";
import { ToggleTab } from "@/shared/components/toggle-tab";
import { formatDate, useTranslation } from "@/shared/i18n";

import {
  clampMonth,
  getMonthOptions,
  getYearOptions,
} from "../lib/period-options";
import { useUsageLayout } from "../lib/use-usage-layout";
import { UsageChart } from "./UsageChart";

import type {
  ActiveProductType,
  UsageGranularity,
  UsageMetric,
} from "@/entities/subscription";

interface UsageStatusProps {
  type: ActiveProductType;
  isSubscribed: boolean;
}

// 이용 현황 섹션: 지표·연도·(일별) 월 Select, 월별/일별 토글, 막대 차트. 미구독이면 필터는 두고 차트 자리에 빈 상태를 보임.
export function UsageStatus({ type, isSubscribed }: UsageStatusProps) {
  const { t } = useTranslation("features/view-subscription-usage");
  const layout = useUsageLayout();
  const labelId = useId();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [requestedMetric, setMetric] = useState<UsageMetric>("campaignCount");
  const [granularity, setGranularity] = useState<UsageGranularity>("monthly");
  const [year, setYear] = useState(currentYear);
  const [requestedMonth, setMonth] = useState(currentMonth);

  // 상품을 바꿔 고를 수 없게 된 지표(PICK형 → 모집형의 매칭 성사 수)는 첫 지표로 돌림.
  const metrics = USAGE_METRICS_BY_TYPE[type];
  const metric = metrics.includes(requestedMetric)
    ? requestedMetric
    : (metrics[0] ?? "campaignCount");
  const month = clampMonth(requestedMonth, year, currentYear, currentMonth);

  const { data: points } = useUsageSeries({
    type,
    metric,
    granularity,
    year,
    month,
  });

  const metricOptions = metrics.map((value) => ({
    value,
    label: t(`metric.${value}`),
  }));
  const yearOptions = getYearOptions(currentYear).map((value) => ({
    value: String(value),
    label: formatDate(new Date(value, 0, 1), { year: "numeric" }),
  }));
  const monthOptions = getMonthOptions(year, currentYear, currentMonth).map(
    (value) => ({
      value: String(value),
      label: formatDate(new Date(2000, value - 1, 1), { month: "short" }),
    }),
  );

  const isCurrentPeriod =
    granularity === "monthly"
      ? year === currentYear
      : year === currentYear && month === currentMonth;
  const focusPeriod = isCurrentPeriod
    ? granularity === "monthly"
      ? currentMonth
      : today.getDate()
    : null;
  // 조건이나 화면 크기가 바뀌면 차트를 새로 그려 처음 위치부터 보임.
  const chartKey = [type, metric, granularity, year, month, layout].join("-");

  return (
    <section className="flex flex-col gap-3 tablet:gap-4">
      <h2 className="text-base leading-none font-semibold text-foreground">
        {t("status.title")}
      </h2>
      <div className="flex flex-col gap-3 tablet:flex-row tablet:items-start tablet:justify-between">
        <div className="flex flex-wrap items-center gap-2 **:data-[slot=select-trigger]:w-auto **:data-[slot=select-trigger]:gap-2 tablet:gap-3 tablet:**:data-[slot=select-trigger]:gap-4">
          <span id={`${labelId}-metric`} className="sr-only">
            {t("filter.metric")}
          </span>
          <span id={`${labelId}-year`} className="sr-only">
            {t("filter.year")}
          </span>
          <span id={`${labelId}-month`} className="sr-only">
            {t("filter.month")}
          </span>
          <OptionSelect
            aria-labelledby={`${labelId}-metric`}
            value={metric}
            options={metricOptions}
            onChangeValue={(value) => {
              const next = metrics.find((candidate) => candidate === value);
              if (next) setMetric(next);
            }}
          />
          <OptionSelect
            aria-labelledby={`${labelId}-year`}
            value={String(year)}
            options={yearOptions}
            onChangeValue={(value) => setYear(Number(value))}
          />
          {granularity === "daily" && (
            <OptionSelect
              aria-labelledby={`${labelId}-month`}
              value={String(month)}
              options={monthOptions}
              onChangeValue={(value) => setMonth(Number(value))}
            />
          )}
        </div>
        <ToggleTab
          aria-label={t("filter.granularity")}
          className="self-start *:[[role=radio]]:min-w-14 max-tablet:*:[[role=radio]]:py-1"
          value={granularity}
          options={[
            { value: "monthly", label: t("filter.monthly") },
            { value: "daily", label: t("filter.daily") },
          ]}
          onValueChange={(value) => {
            if (value === "monthly" || value === "daily") setGranularity(value);
          }}
        />
      </div>
      {isSubscribed ? (
        <UsageChart
          key={chartKey}
          points={points}
          granularity={granularity}
          year={year}
          month={month}
          layout={layout}
          focusPeriod={focusPeriod}
        />
      ) : (
        <div className="flex min-h-57 items-center justify-center rounded-lg border desktop:min-h-79">
          <EmptyState
            type="no-list"
            title={t("empty.title")}
            description={t("empty.description")}
          />
        </div>
      )}
    </section>
  );
}
