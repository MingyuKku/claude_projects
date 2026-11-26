import { Download } from "lucide-react";

import { InfoRow } from "@/shared/components/info-row";
import { Inform } from "@/shared/components/inform";
import { formatNumber, useTranslation } from "@/shared/i18n";
import { saveFile } from "@/shared/lib";
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

interface RowProps {
  label: string;
  children: ReactNode;
  isStrong?: boolean;
  valueType?: "text" | "control";
}

function Row({ label, children, isStrong = false, valueType }: RowProps) {
  return (
    <InfoRow
      label={label}
      labelWidth="content"
      valueType={valueType}
      emphasis={isStrong ? "total" : "none"}
      hasDivider
    >
      {children}
    </InfoRow>
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
          <div className="flex flex-col gap-2">
            <Row label={t("confirm.amount")}>
              {t("won", { amount: formatNumber(amount) })}
            </Row>
            <Row label={t("confirm.bank")}>{bankName}</Row>
            <Row label={t("confirm.accountNumber")}>{accountNumber}</Row>
            <Row label={t("confirm.accountHolder")}>{accountHolder}</Row>
            <Row label={t("confirm.method")}>{t("confirm.methodValue")}</Row>
            <Row label={t("confirm.bankBook")} valueType="control">
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
          </div>
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
