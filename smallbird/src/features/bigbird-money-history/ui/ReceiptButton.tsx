import { Download, FileText } from "lucide-react";

import { useTranslation } from "@/shared/i18n";
import { openReceipt } from "@/shared/lib/receipt";
import { Button } from "@/shared/ui/button";

import type { ChargeRecord } from "../model/charge-types";

interface ReceiptButtonProps {
  record: ChargeRecord;
  /** table: 표의 아이콘 버튼, card: MO 카드의 "거래명세서 ⬇", detail: 거래 상세 하단의 전체 폭 버튼. */
  variant: "table" | "card" | "detail";
}

// 거래명세서는 결제 완료 건만 켬(주소가 없으면 비활성). 이니시스가 호스팅하는 페이지를 새 창으로 엶.
export function ReceiptButton({ record, variant }: ReceiptButtonProps) {
  const { t } = useTranslation("features/bigbird-money-history");
  const { receiptUrl } = record;
  const handleClick = () => {
    if (receiptUrl) openReceipt(receiptUrl);
  };

  if (variant === "table") {
    return (
      <Button
        variant="outline-foreground"
        size="icon-sm"
        className="min-w-0"
        aria-label={t("charge.action.receipt")}
        disabled={!receiptUrl}
        onClick={handleClick}
      >
        <FileText />
      </Button>
    );
  }

  return (
    // 시안: 거래 상세 하단 "거래명세서 받기"는 Outline(파랑 글자, `11224:104200`), 카드 위 "거래명세서"는 Outline Foreground.
    <Button
      variant={variant === "detail" ? "outline" : "outline-foreground"}
      className={variant === "detail" ? "w-full" : undefined}
      size={variant === "card" ? "sm" : "default"}
      disabled={!receiptUrl}
      onClick={handleClick}
    >
      {variant === "detail" ? (
        <>
          <Download />
          {t("charge.detail.receipt")}
        </>
      ) : (
        <>
          {t("charge.action.receiptShort")}
          <Download />
        </>
      )}
    </Button>
  );
}
