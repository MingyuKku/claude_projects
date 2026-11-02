import { cn } from "@/shared/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

import type { ComponentProps, ReactNode } from "react";

// Figma Card / Avatar(6987:112262)·Card / Badge(6987:112408): 작은 제목 + 하단 요약 한 줄.
// children 자리에 아바타 묶음이나 `<Badge size="sm">`를, aside에 오른쪽 보조 문구(예: "50명")를 넣음.
interface SummaryCardProps extends Omit<ComponentProps<"div">, "title"> {
  title: ReactNode;
  icon?: ReactNode;
  aside?: ReactNode;
  interactive?: boolean;
}

export function SummaryCard({
  title,
  icon,
  aside,
  interactive = true,
  className,
  children,
  ...props
}: SummaryCardProps) {
  return (
    <Card interactive={interactive} className={className} {...props}>
      <CardHeader>
        {icon}
        <CardTitle className="text-sm leading-6">{title}</CardTitle>
      </CardHeader>
      <CardContent
        className={cn(
          "flex items-end pt-1.5",
          aside != null && "justify-between",
        )}
      >
        {children}
        {aside != null && (
          <span className="text-sm leading-5 whitespace-nowrap text-muted-foreground">
            {aside}
          </span>
        )}
      </CardContent>
    </Card>
  );
}

/** Card / Avatar의 겹친 아바타 묶음(-10px 겹침) */
export function SummaryCardAvatars({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center -space-x-2.5", className)}
      {...props}
    />
  );
}
