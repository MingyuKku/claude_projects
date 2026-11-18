import { PenLine } from "lucide-react";

import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

import type { ReactNode } from "react";

interface DetailSectionProps {
  number: number;
  title: string;
  /** 넘기면 오른쪽 아래 "수정"(반려 상태의 1·2·3·5·6번). */
  onClickEdit?: () => void;
  children: ReactNode;
}

export function DetailSection({
  number,
  title,
  onClickEdit,
  children,
}: DetailSectionProps) {
  const { t } = useTranslation("features/register-campaign");

  return (
    <section className="flex flex-col rounded-lg border bg-card ds-p-5">
      <div className="flex flex-col ds-gap-5 desktop:flex-row">
        <h3 className="flex h-12 shrink-0 items-center gap-2 px-4 ds-text-sm-5-medium desktop:w-75">
          <Badge size="sm" className="size-5 justify-center">
            {number}
          </Badge>
          {title}
        </h3>
        <dl className="grid min-w-0 flex-1 desktop:grid-cols-2">{children}</dl>
      </div>
      {onClickEdit && (
        <div className="flex justify-end pt-3">
          <Button variant="outline" onClick={onClickEdit}>
            <PenLine aria-hidden />
            {t("detail.edit")}
          </Button>
        </div>
      )}
    </section>
  );
}

interface DetailRowProps {
  label: string;
  children: ReactNode;
  /** 긴 값(주소·설명·이미지)은 두 열을 차지함. */
  isWide?: boolean;
}

export function DetailRow({ label, children, isWide }: DetailRowProps) {
  return (
    <div
      className={cn("flex min-w-0 items-start", isWide && "desktop:col-span-2")}
    >
      <dt className="flex min-h-12 w-30 shrink-0 items-center px-4 ds-text-sm-5-semibold tablet:w-42.5">
        {label}
      </dt>
      <dd className="flex min-h-12 min-w-0 flex-1 items-center px-4 py-3.5 ds-text-sm-5-normal break-words">
        {children}
      </dd>
    </div>
  );
}

export function StatusBadge({
  isPositive,
  children,
}: {
  isPositive: boolean;
  children: ReactNode;
}) {
  return (
    <Badge size="sm" variant={isPositive ? "green" : "gray"}>
      {children}
    </Badge>
  );
}
