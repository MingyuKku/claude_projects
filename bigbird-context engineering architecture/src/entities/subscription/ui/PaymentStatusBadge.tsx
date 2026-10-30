import { useTranslation } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";

import { toPaymentStatus } from "../model/codes";

import type { PaymentStatus } from "../model/codes";
import type { ComponentProps } from "react";

// 결제 완료(회색)·환불 진행(빨강)·환불 완료(초록). PC 시안 기준(스펙 §3 시안 오류 통일).
const VARIANT_BY_STATUS = {
  paid: "gray",
  refunding: "red",
  refunded: "green",
} as const satisfies Record<
  PaymentStatus,
  ComponentProps<typeof Badge>["variant"]
>;

interface PaymentStatusBadgeProps {
  /** 서버 결제 상태 코드. 모르는 코드면 서버 값을 회색으로 그대로 보임. */
  serverValue: string;
  size?: ComponentProps<typeof Badge>["size"];
}

export function PaymentStatusBadge({
  serverValue,
  size,
}: PaymentStatusBadgeProps) {
  const { t } = useTranslation("entities/subscription");
  const status = toPaymentStatus(serverValue);

  return (
    <Badge variant={status ? VARIANT_BY_STATUS[status] : "gray"} size={size}>
      {status ? t(`paymentStatus.${status}`) : serverValue}
    </Badge>
  );
}
