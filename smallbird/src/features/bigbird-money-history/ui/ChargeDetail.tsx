import { ChargeStatusText } from "@/entities/bigbird-money";
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

// 거래 상세 보기. 충전 건(PC 시안 11224:104140)·출금 건(11224:105015) 모두 9행 + 하단 "거래명세서 받기"이고 라벨만 다름.
// 모든 기기 같은 행(TAB·MO 시안은 3.0.8 순서로 남아 있어 스펙 §7 D-1로 확인 중, PC 기준으로 통일).
// 승인 일자 행은 쓰지 않음: 충전은 요청 일자와 같은 값이고 출금은 항상 "-"라 정보가 없음(사용자 결정 2026-10-30).
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
          value: record.accountNumber,
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
