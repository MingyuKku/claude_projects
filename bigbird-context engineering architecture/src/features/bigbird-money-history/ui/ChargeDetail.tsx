import { ChargeStatusBadge } from "@/entities/bigbird-money";
import { useTranslation } from "@/shared/i18n";

import { useMoneyFormat } from "../lib/use-money-format";
import { usePaymentMethodLabel } from "../lib/use-payment-method-label";
import { DetailPanel } from "./DetailPanel";
import { ReceiptButton } from "./ReceiptButton";

import type { ChargeRecord } from "../model/charge-types";

interface ChargeDetailProps {
  record: ChargeRecord;
  onClose: () => void;
  /** TAB·MO는 제목 앞에 뒤로 버튼도 둠(시안). */
  hasBackButton?: boolean;
}

// 거래 상세 보기(계좌 거래 시안 10061:203175): 승인 일자·입금 요청 일자·충전 요청 금액·결제 수단·은행 명·가상 계좌 번호·입금 완료 일·입금 여부,
// 하단 "거래명세서 받기". 모든 기기 8행(MO 시안 7행은 통일, 스펙 §3). 승인 일자와 입금 완료 일은 서버가 입금 완료 일시 하나(`depositDate`)로 줌.
export function ChargeDetail({
  record,
  onClose,
  hasBackButton,
}: ChargeDetailProps) {
  const { t } = useTranslation("features/bigbird-money-history");
  const { formatDateTime, formatWon } = useMoneyFormat();
  const paymentMethodLabel = usePaymentMethodLabel();
  const depositedAt = formatDateTime(
    record.depositedAt,
    record.depositedAtText,
  );

  return (
    <DetailPanel
      title={t("charge.detail.title")}
      hasBackButton={hasBackButton}
      onClose={onClose}
      footer={<ReceiptButton record={record} variant="detail" />}
      rows={[
        {
          key: "approvedAt",
          label: t("charge.detail.approvedAt"),
          value: depositedAt,
        },
        {
          key: "requestedAt",
          label: t("charge.detail.requestedAt"),
          value: formatDateTime(record.requestedAt, record.requestedAtText),
        },
        {
          key: "amount",
          label: t("charge.detail.amount"),
          value: formatWon(record.amount),
        },
        {
          key: "method",
          label: t("charge.detail.method"),
          value: paymentMethodLabel(record.payMethod),
        },
        {
          key: "bank",
          label: t("charge.detail.bank"),
          value: record.bankName,
        },
        {
          key: "account",
          label: t("charge.detail.account"),
          value: record.accountNumber,
        },
        {
          key: "depositedAt",
          label: t("charge.detail.depositedAt"),
          value: depositedAt,
        },
        {
          key: "status",
          label: t("charge.detail.status"),
          value: (
            <ChargeStatusBadge
              serverValue={record.statusText}
              status={record.status}
              size="sm"
            />
          ),
        },
      ]}
    />
  );
}
