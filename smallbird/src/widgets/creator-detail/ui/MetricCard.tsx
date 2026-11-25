import { useTranslation } from "@/shared/i18n";
import { EMPTY_VALUE } from "@/shared/lib";

import type { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  children: ReactNode;
}

export function MetricCard({ title, children }: MetricCardProps) {
  return (
    <section className="flex min-w-0 flex-col ds-gap-3 rounded-md border bg-background p-4">
      <h4 className="ds-text-sm-none-medium text-muted-foreground">{title}</h4>
      {children}
    </section>
  );
}

function MetricMessage({ children }: { children: ReactNode }) {
  return (
    <p className="flex min-h-20 flex-1 items-center justify-center ds-text-sm-5-medium text-muted-foreground">
      {children}
    </p>
  );
}

/** 서버가 아직 값을 주지 않는 카드. */
export function MetricComingSoon() {
  const { t } = useTranslation();

  return <MetricMessage>{t("status.comingSoon")}</MetricMessage>;
}

/** 이 크리에이터의 값이 없는 카드. */
export function MetricEmpty() {
  return <MetricMessage>{EMPTY_VALUE}</MetricMessage>;
}
