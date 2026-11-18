import { CircleHelp } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

import type { ComponentProps, ReactNode } from "react";

// Figma Card / Toggle(5198:114474): 아이콘+제목, 본문 줄, (선택) 캡션. Hover는 테두리가 사라짐.
interface InfoCardProps extends Omit<ComponentProps<"div">, "title"> {
  title: ReactNode;
  /** 제목 앞 아이콘. 기본은 circle-help, null이면 숨김. */
  icon?: ReactNode;
  /** 본문 아래 회색 캡션(예: "from last month +201") */
  caption?: ReactNode;
  interactive?: boolean;
}

export function InfoCard({
  title,
  icon = <CircleHelp aria-hidden />,
  caption,
  interactive = true,
  className,
  children,
  ...props
}: InfoCardProps) {
  return (
    <Card
      interactive={interactive}
      className={cn(interactive && "hover:border-transparent", className)}
      {...props}
    >
      <CardHeader>
        {icon}
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="flex flex-col text-foreground">{children}</div>
        {caption && (
          <p className="flex items-center gap-1 py-0.5 text-xs leading-4 text-muted-foreground">
            {caption}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
