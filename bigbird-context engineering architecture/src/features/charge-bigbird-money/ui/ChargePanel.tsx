import { ArrowLeft, CircleAlert, X } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { BalanceCard, useBigbirdMoneyBalance } from "@/entities/bigbird-money";
import { SubHeader } from "@/shared/components/app-header";
import { PriceField } from "@/shared/components/text-field";
import { formatNumber, useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { useRequestCharge } from "../api/use-request-charge";
import {
  addAmount,
  getAmountError,
  isChargeable,
  parseAmount,
} from "../lib/amount";
import {
  MAX_CHARGE_AMOUNT,
  MIN_CHARGE_AMOUNT,
  QUICK_AMOUNTS,
} from "../model/constants";
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
  const { isRequesting, request } = useRequestCharge();
  const [amount, setAmount] = useState<number | null>(null);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const errorId = useId();

  const error = getAmountError(amount);
  const canCharge = isChargeable(amount) && !isRequesting;

  // 충전하기는 약관 팝업을 열고, 팝업에서 동의해야 결제창으로 넘어감(v2의 필수 동의).
  function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    if (!isChargeable(amount) || isRequesting) return;
    setIsTermsOpen(true);
  }

  async function handleAgree() {
    if (!isChargeable(amount) || isRequesting) return;
    setIsTermsOpen(false);
    const isStarted = await request(amount);
    if (isStarted === false) toast.error(tCommon("error.unexpected"));
  }

  return (
    <form
      onSubmit={handleSubmit}
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
                <ArrowLeft />
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
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 tablet:gap-8 tablet:px-5 tablet:pt-4 tablet:pb-3">
        <BalanceCard amount={balance?.amount} />

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <PriceField
                label={t("field.label")}
                unit={t("field.unit")}
                placeholder={t("field.placeholder")}
                autoComplete="off"
                value={amount === null ? "" : formatNumber(amount)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                onChange={(event) => setAmount(parseAmount(event.target.value))}
              />
              {error && (
                <p
                  id={errorId}
                  role="alert"
                  className="text-sm leading-5 text-destructive"
                >
                  {t(`error.${error}`, {
                    amount: formatNumber(
                      error === "min" ? MIN_CHARGE_AMOUNT : MAX_CHARGE_AMOUNT,
                    ),
                  })}
                </p>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_AMOUNTS.map((quick) => (
                <Button
                  key={quick}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-w-0"
                  onClick={() =>
                    setAmount((current) => addAmount(current, quick))
                  }
                >
                  {t(`quick.${quick}`)}
                </Button>
              ))}
            </div>
          </div>

          <ul className="flex flex-col gap-2 border-t pt-5 text-sm leading-5 text-muted-foreground">
            <li className="flex items-start gap-1.5">
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              {t("notice.min", { amount: formatNumber(MIN_CHARGE_AMOUNT) })}
            </li>
            <li className="flex items-start gap-1.5">
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              {t("notice.max", { amount: formatNumber(MAX_CHARGE_AMOUNT) })}
            </li>
          </ul>
        </div>
      </div>
      <div className="p-4 tablet:p-5">
        <Button type="submit" className="w-full" disabled={!canCharge}>
          {t("submit", { amount: formatNumber(amount ?? 0) })}
        </Button>
      </div>
      <ChargeTermsDialog
        isOpen={isTermsOpen}
        isAgreeing={isRequesting}
        onClose={() => setIsTermsOpen(false)}
        onAgree={() => void handleAgree()}
      />
    </form>
  );
}
