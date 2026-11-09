import { ChevronLeft, X } from "lucide-react";

import { BalanceCard, useBigbirdMoneyBalance } from "@/entities/bigbird-money";
import { SubHeader } from "@/shared/components/app-header";
import { formatNumber, useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";

import { useChargeForm } from "../model/use-charge-form";
import { ChargeAmountFields } from "./ChargeAmountFields";
import { ChargeTermsDialog } from "./ChargeTermsDialog";

interface ChargePanelProps {
  onClose: () => void;
  /** TAB·MO는 제목 앞에 뒤로 버튼도 둠(시안). */
  hasBackButton?: boolean;
}

// 빅버드 머니 충전 패널(Figma 충전 Default·Filled). PC는 오른쪽 인라인 패널, TAB·MO는 본문을 대체하는 카드. 배치는 페이지가 정함.
// 결제 수단은 무통장 입금뿐이라 수단 선택이 없고, 결제창(이니시스)에서 가상계좌를 받음.
export function ChargePanel({
  onClose,
  hasBackButton = false,
}: ChargePanelProps) {
  const { t } = useTranslation("features/charge-bigbird-money");
  const { t: tCommon } = useTranslation();
  const { balance } = useBigbirdMoneyBalance();
  const form = useChargeForm();

  return (
    <form
      onSubmit={form.handleSubmit}
      noValidate
      className="flex min-h-0 flex-1 flex-col bg-background"
    >
      <SubHeader
        title={
          <>
            {hasBackButton && (
              <Button
                type="button"
                variant="outline-foreground"
                size="icon-sm"
                aria-label={tCommon("action.back")}
                onClick={onClose}
              >
                <ChevronLeft />
              </Button>
            )}
            {t("title")}
          </>
        }
        actions={
          <Button
            type="button"
            variant="ghost-foreground"
            size="icon"
            className="tablet:size-12 tablet:[&_svg:not([class*='size-'])]:size-6"
            aria-label={tCommon("action.close")}
            onClick={onClose}
          >
            <X />
          </Button>
        }
      />
      <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:block!">
        <div className="flex flex-col gap-6 p-4 tablet:gap-8 tablet:px-5 tablet:pt-4 tablet:pb-3">
          <BalanceCard amount={balance?.amount} />

          <ChargeAmountFields form={form} />
        </div>
      </ScrollArea>
      <div className="p-4 tablet:p-5">
        <Button type="submit" className="w-full" disabled={!form.canCharge}>
          {t("submit", { amount: formatNumber(form.amount ?? 0) })}
        </Button>
      </div>
      <ChargeTermsDialog
        isOpen={form.isTermsOpen}
        isAgreeing={form.isRequesting}
        onClose={form.closeTerms}
        onAgree={() => void form.handleAgree()}
      />
    </form>
  );
}
