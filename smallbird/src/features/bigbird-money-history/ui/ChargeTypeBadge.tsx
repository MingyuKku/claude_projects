import { useTranslation } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";

import type { ChargeRecord } from "../model/charge-types";

const VARIANT_BY_TYPE = { charge: "blue", withdraw: "red" } as const;

interface ChargeTypeBadgeProps {
  record: Pick<ChargeRecord, "type" | "typeText">;
}

// 모르는 서버 값은 그대로 회색 배지.
export function ChargeTypeBadge({ record }: ChargeTypeBadgeProps) {
  const { t } = useTranslation("features/bigbird-money-history");

  // 구분을 알 수 없고 서버 값도 없으면 빈 배지를 그리지 않음.
  if (!record.type && !record.typeText) return null;

  return (
    <Badge
      variant={record.type ? VARIANT_BY_TYPE[record.type] : "gray"}
      size="sm"
    >
      {record.type ? t(`charge.type.${record.type}`) : record.typeText}
    </Badge>
  );
}
