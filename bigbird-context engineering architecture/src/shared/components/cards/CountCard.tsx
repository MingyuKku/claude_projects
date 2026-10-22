import { Fragment } from "react";

import { cn } from "@/shared/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";
import { Separator } from "@/shared/ui/separator";

import type { ComponentProps, ReactNode } from "react";

// Figma Card / Count(6934:86666): 제목 + 큰 숫자·단위 + (선택) 증감 캡션.
// 하단에 버튼(Button) 또는 사용량 Progress가 붙으면 Figma처럼 Hover·Focus 상태가 없음.
export interface CountCardUsageItem {
  id: string;
  label: ReactNode;
  value: ReactNode;
}

export interface CountCardUsage {
  /** 0~100 */
  percent: number;
  items: CountCardUsageItem[];
}

interface CountCardProps extends Omit<ComponentProps<"div">, "title"> {
  title: ReactNode;
  icon?: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  /** 숫자 아래 회색 캡션(예: "from last month") */
  caption?: ReactNode;
  /** 캡션 옆 초록 증감 값(예: "+201%") */
  change?: ReactNode;
  /** 하단 버튼 영역(`<Button className="flex-1">`) */
  action?: ReactNode;
  usage?: CountCardUsage;
}

export function CountCard({
  title,
  icon,
  value,
  unit,
  caption,
  change,
  action,
  usage,
  className,
  ...props
}: CountCardProps) {
  const hasFooter = Boolean(action) || Boolean(usage);

  return (
    <Card interactive={!hasFooter} className={className} {...props}>
      <CardHeader>
        {icon}
        <CardTitle className="text-sm leading-6">{title}</CardTitle>
      </CardHeader>
      <CardContent
        className={cn("flex flex-col gap-2 pt-1.5", hasFooter && "pb-0")}
      >
        <p className="flex items-center gap-1 font-semibold text-foreground">
          <span className="text-2xl leading-none tracking-[-0.6px]">
            {value}
          </span>
          {unit && (
            <span className="pt-0.5 text-base leading-none">{unit}</span>
          )}
        </p>
        {(Boolean(caption) || Boolean(change)) && (
          <p className="flex items-center gap-1 py-0.5 text-xs leading-4">
            <span className="text-muted-foreground">{caption}</span>
            <span className="font-medium text-success">{change}</span>
          </p>
        )}
      </CardContent>
      {hasFooter && (
        <div className="flex gap-2 p-5">
          {action}
          {usage && (
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Progress
                size="lg"
                value={usage.percent}
                className="*:data-[slot=progress-indicator]:bg-muted-foreground"
              />
              <dl className="flex h-5 items-center justify-end gap-3 text-xs leading-5">
                {usage.items.map((item, index) => (
                  <Fragment key={item.id}>
                    {index > 0 && <Separator orientation="vertical" />}
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      <dt className="font-medium text-muted-foreground">
                        {item.label}
                      </dt>
                      <dd className="font-semibold text-foreground">
                        {item.value}
                      </dd>
                    </div>
                  </Fragment>
                ))}
              </dl>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
