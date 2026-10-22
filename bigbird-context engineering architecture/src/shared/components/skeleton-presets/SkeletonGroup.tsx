import { useTranslation } from "@/shared/i18n";

import type { ReactNode } from "react";

interface SkeletonGroupProps {
  className?: string;
  children: ReactNode;
}

/** 스켈레톤 묶음. 막대는 aria-hidden이라 화면 낭독기에는 "불러오는 중" 문구만 읽힘 */
export function SkeletonGroup({ className, children }: SkeletonGroupProps) {
  const { t } = useTranslation();

  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{t("status.loading")}</span>
      {children}
    </div>
  );
}
