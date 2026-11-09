import { Wallet } from "lucide-react";

import { formatNumber, useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

import type { ReactNode } from "react";

interface BalanceCardProps {
  /** 보유 금액. 아직 불러오지 못했거나 실패했으면 undefined라 "—"로 보임. */
  amount: number | undefined;
  /** 제목 줄 오른쪽 작은 버튼 자리(출금하기). 없으면 그리지 않음. */
  headerAction?: ReactNode;
  /** 금액 아래 버튼 자리(충전하기). 없으면 그리지 않음. */
  action?: ReactNode;
  /** 제목의 헤딩 레벨. 다른 화면 안에 놓일 때 그 화면의 제목 계층에 맞춤(기본 h2). */
  titleAs?: "h2" | "h3";
  className?: string;
}

// Figma Card / Count: 지갑 아이콘 + 제목, 큰 금액 + 단위 "원", 선택 버튼. 충전 내역 탭과 충전 패널이 함께 씀.
// 버튼이 있으면 금액 영역 아래 16px(MO 4px) + 버튼 영역 20px 여백(시안 PC 카드 176·MO 160). MO는 제목 줄 좌우 16·금액 20px.
export function BalanceCard({
  amount,
  headerAction,
  action,
  titleAs: Title = "h2",
  className,
}: BalanceCardProps) {
  const { t } = useTranslation("entities/bigbird-money");

  return (
    <section
      className={cn(
        "flex min-h-24 flex-col overflow-hidden rounded-lg border bg-card",
        className,
      )}
    >
      <div className="flex items-center gap-2 px-4 pt-4 pb-1.5 tablet:px-5">
        <Title className="flex min-w-0 flex-1 items-center gap-1.5 text-sm leading-6 font-semibold text-card-foreground">
          <Wallet aria-hidden className="size-4 shrink-0" />
          {t("balance.title")}
        </Title>
        {headerAction}
      </div>
      <p
        className={cn(
          "flex items-center gap-1 px-5 pt-1.5 text-foreground",
          action ? "pb-1 tablet:pb-4" : "pb-5",
        )}
      >
        <span className="text-xl leading-none font-semibold tracking-[-0.6px] tablet:text-2xl">
          {amount === undefined ? "—" : formatNumber(amount)}
        </span>
        <span className="pt-0.5 text-base leading-none font-semibold">
          {t("balance.unit")}
        </span>
      </p>
      {/* 옆 안내 카드가 더 높으면 버튼은 카드 아래쪽에 붙음(시안 TAB `11224:104315`). */}
      {action && <div className="mt-auto flex flex-col p-5">{action}</div>}
    </section>
  );
}
