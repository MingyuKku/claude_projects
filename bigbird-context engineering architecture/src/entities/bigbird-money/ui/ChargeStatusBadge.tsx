import { useTranslation } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";

import type { ChargeStatus } from "../model/charge-status";
import type { ComponentProps } from "react";

const VARIANT_BY_STATUS = {
  paid: "green",
  pending: "gray",
  canceled: "red",
} as const satisfies Record<
  ChargeStatus,
  ComponentProps<typeof Badge>["variant"]
>;

interface ChargeStatusBadgeProps {
  /** 서버 입금 상태 값. 모르는 값이면 서버 값을 회색으로 그대로 보임. */
  serverValue: string;
  status: ChargeStatus | null;
  size?: ComponentProps<typeof Badge>["size"];
}

export function ChargeStatusBadge({
  serverValue,
  status,
  size,
}: ChargeStatusBadgeProps) {
  const { t } = useTranslation("entities/bigbird-money");

  return (
    <Badge variant={status ? VARIANT_BY_STATUS[status] : "gray"} size={size}>
      {status ? t(`chargeStatus.${status}`) : serverValue}
    </Badge>
  );
}
