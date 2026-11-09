import { ChargeStatusText } from "@/entities/bigbird-money";
import { FullTextHint } from "@/shared/components/full-text-hint";
import { useTranslation } from "@/shared/i18n";

import { useMoneyFormat } from "../lib/use-money-format";
import { usePaymentMethodLabel } from "../lib/use-payment-method-label";
import { ChargeTypeBadge } from "./ChargeTypeBadge";
import { DetailPanel } from "./DetailPanel";
import { ReceiptButton } from "./ReceiptButton";
import { TestDepositButton } from "./TestDepositButton";

import type { ChargeRecord } from "../model/charge-types";

interface ChargeDetailProps {
  record: ChargeRecord;
  onClose: () => void;
  /** TAB·MO는 제목 앞에 뒤로 버튼도 둠(시안). */
  hasBackButton?: boolean;
}

export function ChargeDetail({
  record,
  onClose,
  hasBackButton,
}: ChargeDetailProps) {
  const { t } = useTranslation("features/bigbird-money-history");
  const { formatDateTime, formatWon } = useMoneyFormat();
  const paymentMethodLabel = usePaymentMethodLabel();
  const isWithdraw = record.type === "withdraw";
  // 개발 서버에서만: 대기 중 무통장 입금 충전 건을 Stage 테스트 API로 입금 완료 처리(실제 입금 대신).
  const canTestDeposit =
    import.meta.env.DEV &&
    record.type === "charge" &&
    record.status === "pending" &&
    record.payMethod === "VBANK";

  return (
    <DetailPanel
      title={t("charge.detail.title")}
      hasBackButton={hasBackButton}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2">
          {canTestDeposit && <TestDepositButton record={record} />}
          <ReceiptButton record={record} variant="detail" />
        </div>
      }
      rows={[
        {
          key: "type",
          label: t("charge.detail.type"),
          value: <ChargeTypeBadge record={record} />,
        },
        {
          key: "requestedAt",
          label: isWithdraw
            ? t("charge.detail.withdraw.requestedAt")
            : t("charge.detail.requestedAt"),
          value: formatDateTime(record.requestedAt, record.requestedAtText),
        },
        {
          key: "amount",
          label: isWithdraw
            ? t("charge.detail.withdraw.amount")
            : t("charge.detail.amount"),
          value: formatWon(record.amount),
        },
        isWithdraw
          ? {
              key: "method",
              label: t("charge.detail.withdraw.method"),
              value: t("charge.detail.withdraw.methodValue"),
            }
          : {
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
          // 값 칸이 좁은 PC 패널에서 긴 계좌번호가 두 줄이 되지 않게 한 줄로 두고, 잘리면 전체를 보여 줌.
          value: (
            <FullTextHint text={record.accountNumber} className="text-right" />
          ),
        },
        {
          key: "holder",
          label: isWithdraw
            ? t("charge.detail.withdraw.holder")
            : t("charge.detail.holder"),
          value: record.holderName,
        },
        {
          key: "completedAt",
          label: isWithdraw
            ? t("charge.detail.withdraw.completedAt")
            : t("charge.detail.depositedAt"),
          value: formatDateTime(record.completedAt, record.completedAtText),
        },
        {
          key: "status",
          label: isWithdraw
            ? t("charge.detail.withdraw.status")
            : t("charge.detail.status"),
          value: (
            <ChargeStatusText
              serverValue={record.statusText}
              status={record.status}
            />
          ),
        },
      ]}
    />
  );
}
