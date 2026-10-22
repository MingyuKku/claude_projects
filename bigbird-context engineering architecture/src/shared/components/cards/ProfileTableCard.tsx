import { Card } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Separator } from "@/shared/ui/separator";

import type { ComponentProps, ReactNode } from "react";

// Figma Card / Table / Mobile(7119:139040): 모바일에서 표 한 행을 카드로 보여 줌.
// 머리글(체크박스·프로필·버튼) 아래에 "항목명 | 값" 행을 48px 높이로 나열함.
export interface ProfileTableCardRow {
  id: string;
  label: ReactNode;
  value: ReactNode;
}

interface ProfileTableCardProps extends ComponentProps<"div"> {
  avatar: ReactNode;
  name: ReactNode;
  description?: ReactNode;
  /** 오른쪽 위 버튼 묶음(`<Toggle variant="outline" size="sm">` 등) */
  actions?: ReactNode;
  rows: ProfileTableCardRow[];
  isChecked?: boolean;
  onCheckedChange?: (isChecked: boolean) => void;
  checkboxLabel: string;
}

export function ProfileTableCard({
  avatar,
  name,
  description,
  actions,
  rows,
  isChecked = false,
  onCheckedChange,
  checkboxLabel,
  className,
  ...props
}: ProfileTableCardProps) {
  return (
    <Card className={className} {...props}>
      <div className="flex items-center py-4 pr-4">
        <div className="flex h-12 items-center px-4">
          <Checkbox
            aria-label={checkboxLabel}
            checked={isChecked}
            onCheckedChange={(state) => onCheckedChange?.(state === true)}
          />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {avatar}
            <div className="flex min-w-0 flex-1 flex-col gap-1 text-base leading-none">
              <p className="truncate font-medium text-foreground">{name}</p>
              {description && (
                <p className="truncate text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
      <Separator className="mx-4 data-[orientation=horizontal]:w-auto" />
      <dl className="flex flex-col pt-2.5 pb-4 text-sm leading-5 text-foreground">
        {rows.map((row) => (
          <div key={row.id} className="flex h-12 items-center">
            <dt className="w-36 shrink-0 truncate px-4 font-semibold">
              {row.label}
            </dt>
            <dd className="flex min-w-0 flex-1 justify-end truncate px-4 text-right">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
