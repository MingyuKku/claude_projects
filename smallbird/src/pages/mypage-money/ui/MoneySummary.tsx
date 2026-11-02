import { ChevronRight } from "lucide-react";

import { BalanceCard, useBigbirdMoneyBalance } from "@/entities/bigbird-money";
import { ChargeNotice } from "@/features/bigbird-money-history";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

interface MoneySummaryProps {
  /** PC 오른쪽 패널이 열려 있음. 카드 폭이 278로 줄어듦(시안 `11224:104058`). */
  isPanelOpen: boolean;
  onOpenCharge: () => void;
  onOpenWithdraw: () => void;
}

// 보유 머니 카드 + 충전 안내. 두 탭 위에 공통으로 둠(시안 PC `11224:103702`·`11224:103786`, TAB `11224:104315`·`11224:104580`).
// 폭: PC는 카드 고정(376, 패널이 열리면 278) + 안내가 나머지, TAB 1:1, MO 세로 쌓기.
export function MoneySummary({
  isPanelOpen,
  onOpenCharge,
  onOpenWithdraw,
}: MoneySummaryProps) {
  const { t } = useTranslation("pages/mypage-money");
  const { balance, isError: isBalanceError } = useBigbirdMoneyBalance();

  return (
    <div
      className={cn(
        "grid gap-4 tablet:grid-cols-2 tablet:gap-5 desktop:grid-cols-[--spacing(94)_minmax(0,1fr)]",
        isPanelOpen && "desktop:grid-cols-[--spacing(69.5)_minmax(0,1fr)]",
      )}
    >
      <BalanceCard
        amount={balance?.amount}
        headerAction={
          // 잔액 0원·처리 중인 출금은 서버가 withdrawable=false로 알려 줌. 잔액을 못 불러왔으면 요청할 금액이 없어 막음.
          <Button
            type="button"
            variant="outline-muted"
            size="xs"
            disabled={isBalanceError || !balance?.isWithdrawable}
            onClick={onOpenWithdraw}
          >
            {t("withdraw.action")}
          </Button>
        }
        action={
          <Button type="button" onClick={onOpenCharge}>
            {t("charge.action")}
            <ChevronRight />
          </Button>
        }
      />
      <ChargeNotice />
    </div>
  );
}
