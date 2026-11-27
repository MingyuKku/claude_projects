import { HandCoins, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { PriceField } from "@/shared/components/text-field";
import { formatNumber, useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { parseAmount } from "../lib/amount";

interface CounterOfferFormProps {
  currentAmount: number;
  isSending: boolean;
  onSubmit: (amount: number) => void;
  onClose: () => void;
}

// 대화창 아래 "금액 다시 제안하기". 희망 업로드 일정은 시안에 없어 이전 라운드 값을 그대로 둠.
export function CounterOfferForm({
  currentAmount,
  isSending,
  onSubmit,
  onClose,
}: CounterOfferFormProps) {
  const { t } = useTranslation("features/campaign-matching");
  const [amount, setAmount] = useState<number | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  // "다시 제안"을 누르면 바로 금액을 입력하게 함.
  useEffect(() => amountRef.current?.focus(), []);

  return (
    <form
      className="flex shrink-0 flex-col rounded-lg border bg-background"
      onSubmit={(event) => {
        event.preventDefault();
        if (amount !== null) onSubmit(amount);
      }}
    >
      <header className="flex items-center justify-between gap-2 border-b py-1 pr-1 pl-4">
        <h3 className="truncate ds-text-sm-none-semibold">
          {t("counter.title")}
        </h3>
        <Button
          type="button"
          variant="ghost-foreground"
          size="icon"
          aria-label={t("counter.close")}
          onClick={onClose}
        >
          <X />
        </Button>
      </header>
      <div className="grid grid-cols-2 gap-3 px-4 pt-4">
        <PriceField
          label={t("counter.current")}
          unit={t("unit.won")}
          value={formatNumber(currentAmount)}
          disabled
        />
        <PriceField
          label={t("counter.amount")}
          unit={t("unit.won")}
          placeholder={t("counter.placeholder")}
          inputMode="numeric"
          value={amount === null ? "" : formatNumber(amount)}
          onChange={(event) => setAmount(parseAmount(event.target.value))}
          ref={amountRef}
        />
      </div>
      <div className="flex justify-end p-4">
        <Button type="submit" size="sm" disabled={amount === null || isSending}>
          <HandCoins />
          {t("counter.submit")}
        </Button>
      </div>
    </form>
  );
}
