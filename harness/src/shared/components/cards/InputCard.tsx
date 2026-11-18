import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";

import type { ComponentProps, ReactNode } from "react";

// Figma Card / Input(6984:98717): 제목 + 입력창 + outline 버튼.
// Figma에는 카드 바깥 포커스 링 상태만 있어, 입력창에 키보드 포커스가 있을 때 카드에 링을 그림.
interface InputCardProps extends Omit<ComponentProps<"div">, "title"> {
  title: ReactNode;
  inputProps?: ComponentProps<typeof Input>;
  actionLabel: ReactNode;
  onClickAction?: () => void;
  isActionDisabled?: boolean;
}

export function InputCard({
  title,
  inputProps,
  actionLabel,
  onClickAction,
  isActionDisabled,
  className,
  ...props
}: InputCardProps) {
  return (
    <Card
      className={cn(
        "ring-offset-background focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-primary has-[input:focus-visible]:ring-offset-2",
        className,
      )}
      {...props}
    >
      <CardHeader>
        <CardTitle className="text-sm leading-6">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-2 pt-1.5">
        <Input
          {...inputProps}
          className={cn(
            "flex-1 focus-visible:ring-0 focus-visible:ring-offset-0",
            inputProps?.className,
          )}
        />
        <Button
          variant="outline"
          disabled={isActionDisabled}
          onClick={onClickAction}
        >
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
