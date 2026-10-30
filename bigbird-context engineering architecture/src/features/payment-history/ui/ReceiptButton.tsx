import { Download, FileText } from "lucide-react";

import { useTranslation } from "@/shared/i18n";
import { openReceipt } from "@/shared/lib/receipt";
import { Button } from "@/shared/ui/button";

import type { PaymentRecord } from "@/entities/subscription";

interface ReceiptButtonProps {
  record: PaymentRecord;
  /** table: PC 표의 아이콘 버튼, card: TAB·MO 카드의 "거래명세서 ⬇". */
  variant: "table" | "card";
}

// 거래명세서는 결제 완료 건만 켬(스펙 §3). 서버가 준 명세서 주소(변환에서 https만 남김)를 새 창으로 엶.
export function ReceiptButton({ record, variant }: ReceiptButtonProps) {
  const { t } = useTranslation("features/payment-history");
  const { receiptUrl } = record;
  const isEnabled = record.status === "paid" && receiptUrl !== null;
  const handleClick = () => {
    if (receiptUrl) openReceipt(receiptUrl);
  };

  if (variant === "table") {
    return (
      <Button
        variant="outline-foreground"
        size="icon-sm"
        className="size-9 min-w-0"
        aria-label={t("action.receipt")}
        disabled={!isEnabled}
        onClick={handleClick}
      >
        <FileText />
      </Button>
    );
  }

  return (
    <Button
      variant="outline-foreground"
      size="sm"
      className="max-tablet:h-8.5"
      disabled={!isEnabled}
      onClick={handleClick}
    >
      {t("action.receipt")}
      <Download />
    </Button>
  );
}
