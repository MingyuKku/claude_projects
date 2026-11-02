import { useTranslation } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";

import type { UsageRecord, UsageType } from "../model/usage-types";
import type { ComponentProps } from "react";

const VARIANT_BY_TYPE = {
  use: "gray",
  refund: "green",
  charge: "blue",
  withdraw: "red",
} as const satisfies Record<UsageType, ComponentProps<typeof Badge>["variant"]>;

interface UsageTypeBadgeProps {
  record: Pick<UsageRecord, "type" | "typeText">;
}

// 사용 내역의 "구분" 배지: 사용(회색)·환급(초록)·충전(파랑)·출금(빨강). 그 밖의 서버 값(환불 등)은 값을 그대로 회색 배지로 보임.
export function UsageTypeBadge({ record }: UsageTypeBadgeProps) {
  const { t } = useTranslation("features/bigbird-money-history");

  return (
    <Badge
      variant={record.type ? VARIANT_BY_TYPE[record.type] : "gray"}
      size="sm"
    >
      {record.type ? t(`usage.type.${record.type}`) : record.typeText}
    </Badge>
  );
}
