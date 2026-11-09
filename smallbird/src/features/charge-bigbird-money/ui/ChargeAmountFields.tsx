import { CircleAlert } from "lucide-react";
import { useId } from "react";

import { PriceField } from "@/shared/components/text-field";
import { formatNumber, useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { addAmount, parseAmount } from "../lib/amount";
import {
  MAX_CHARGE_AMOUNT,
  MIN_CHARGE_AMOUNT,
  QUICK_AMOUNTS,
} from "../model/constants";

import type { ChargeForm } from "../model/use-charge-form";

interface ChargeAmountFieldsProps {
  form: Pick<ChargeForm, "amount" | "setAmount" | "error">;
}

// 충전 금액 입력(Figma 충전 Default·Filled)과 빠른 금액, 안내. 마이페이지 패널과 결제 화면의 인라인 충전이 함께 씀.
export function ChargeAmountFields({ form }: ChargeAmountFieldsProps) {
  const { t } = useTranslation("features/charge-bigbird-money");
  const errorId = useId();
  const { amount, setAmount, error } = form;

  return (
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
              onClick={() => setAmount((current) => addAmount(current, quick))}
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
  );
}
