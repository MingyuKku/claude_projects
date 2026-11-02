import { Wallet } from "lucide-react";

import { formatNumber, useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

import type { ReactNode } from "react";

interface BalanceCardProps {
  /** 보유 금액. 아직 불러오지 못했거나 실패했으면 undefined라 "—"로 보임. */
  amount: number | undefined;
  /** 금액 아래 버튼 자리(충전하기). 없으면 그리지 않음. */
  action?: ReactNode;
  className?: string;
}

// Figma Card / Count: 지갑 아이콘 + 제목, 큰 금액 + 단위 "원", 선택 버튼. 충전 내역 탭과 충전 패널이 함께 씀.
// 버튼이 있으면 금액 영역의 아래 여백은 0이고 버튼 영역이 20px 여백을 가짐.
export function BalanceCard({ amount, action, className }: BalanceCardProps) {
  const { t } = useTranslation("entities/bigbird-money");

  return (
    <section
      className={cn(
        "flex min-h-24 flex-col overflow-hidden rounded-lg border bg-card",
        className,
      )}
    >
      <h2 className="flex items-center gap-1.5 px-5 pt-4 pb-1.5 text-sm leading-6 font-semibold text-card-foreground">
        <Wallet aria-hidden className="size-4" />
        {t("balance.title")}
      </h2>
      <p
        className={cn(
          "flex items-center gap-1 px-5 pt-1.5 text-foreground",
          !action && "pb-5",
        )}
      >
        <span className="text-2xl leading-none font-semibold tracking-[-0.6px]">
          {amount === undefined ? "—" : formatNumber(amount)}
        </span>
        <span className="pt-0.5 text-base leading-none font-semibold">
          {t("balance.unit")}
        </span>
      </p>
      {action && <div className="flex flex-col p-5">{action}</div>}
    </section>
  );
}
