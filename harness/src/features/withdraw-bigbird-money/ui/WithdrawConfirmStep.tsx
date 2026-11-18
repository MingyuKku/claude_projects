import { Download } from "lucide-react";

import { Inform } from "@/shared/components/inform";
import { formatNumber, useTranslation } from "@/shared/i18n";
import { saveFile } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";

import type { ReactNode } from "react";

interface WithdrawConfirmStepProps {
  /** 출금 금액이자 보유 잔액. */
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  bankBook: File;
  isRequesting: boolean;
  onSubmit: () => void;
}

function Row({
  label,
  children,
  isStrong = false,
}: {
  label: string;
  children: ReactNode;
  isStrong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-12 items-center justify-between gap-4 border-b px-4 text-sm leading-5",
        isStrong && "text-base leading-6 font-semibold",
      )}
    >
      <dt className="shrink-0 font-semibold text-foreground">{label}</dt>
      <dd className="flex min-w-0 justify-end text-right break-all text-foreground">
        {children}
      </dd>
    </div>
  );
}

export function WithdrawConfirmStep({
  amount,
  bankName,
  accountNumber,
  accountHolder,
  bankBook,
  isRequesting,
  onSubmit,
}: WithdrawConfirmStepProps) {
  const { t } = useTranslation("features/withdraw-bigbird-money");

  return (
    <form
      noValidate
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isRequesting) onSubmit();
      }}
    >
      <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:block!">
        <div className="flex flex-col gap-4 p-4 tablet:px-5 tablet:pt-4 tablet:pb-3">
          <dl className="flex flex-col gap-2">
            <Row label={t("confirm.amount")}>
              {t("won", { amount: formatNumber(amount) })}
            </Row>
            <Row label={t("confirm.bank")}>{bankName}</Row>
            <Row label={t("confirm.accountNumber")}>{accountNumber}</Row>
            <Row label={t("confirm.accountHolder")}>{accountHolder}</Row>
            <Row label={t("confirm.method")}>{t("confirm.methodValue")}</Row>
            <Row label={t("confirm.bankBook")}>
              <Button
                type="button"
                variant="outline-foreground"
                size="xs"
                aria-label={t("confirm.bankBookDownload", {
                  name: bankBook.name,
                })}
                className="max-w-full"
                onClick={() => saveFile(bankBook, bankBook.name)}
              >
                <span className="truncate">{bankBook.name}</span>
                <Download />
              </Button>
            </Row>
            <Row label={t("confirm.expected")} isStrong>
              {t("won", { amount: formatNumber(0) })}
            </Row>
          </dl>
          <Inform items={[{ id: "notice", text: t("confirm.notice") }]} />
        </div>
      </ScrollArea>
      <div className="p-4 tablet:p-5">
        <Button type="submit" className="w-full" disabled={isRequesting}>
          {t("confirm.submit")}
        </Button>
      </div>
    </form>
  );
}
