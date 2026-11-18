import { cva } from "class-variance-authority";
import { GripVertical } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";

import type { ComponentProps, ReactNode } from "react";

const leadingVariants = cva("flex min-w-0 flex-1 items-center", {
  variants: {
    type: {
      handle: "gap-2",
      checkbox: "gap-3",
    },
  },
  defaultVariants: { type: "handle" },
});

// Figma Button / List(7021:164334). 폴더 같은 목록 항목.
// type: handle = 드래그 핸들 + 액션 버튼, checkbox = 선택용 체크박스.
// editor를 넘기면 제목 자리를 이름 수정 입력(Handle+Input)으로 바꾸고 액션 버튼을 숨김.
interface ButtonListBaseProps extends Omit<ComponentProps<"div">, "title"> {
  title: string;
  count?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  editor?: ReactNode;
  isChecked?: boolean;
  onCheckedChange?: (isChecked: boolean) => void;
}

// 드래그 핸들은 아이콘만 있는 버튼이라 이름(handleLabel)이 필수.
type ButtonListProps = ButtonListBaseProps &
  (
    | { type?: "handle"; handleLabel: string }
    | { type: "checkbox"; handleLabel?: string }
  );

export function ButtonList({
  type = "handle",
  title,
  count,
  icon,
  actions,
  editor,
  handleLabel,
  isChecked,
  onCheckedChange,
  className,
  ...props
}: ButtonListProps) {
  return (
    <div
      {...props}
      className={cn(
        "flex min-h-16 min-w-20 items-center gap-3 rounded-md border bg-background p-3 hover:bg-accent/50",
        className,
      )}
    >
      <div className={leadingVariants({ type })}>
        {type === "handle" ? (
          <Button
            variant="ghost-foreground"
            size="icon-xss"
            aria-label={handleLabel}
            className="cursor-grab"
          >
            <GripVertical />
          </Button>
        ) : (
          <span className="flex p-2">
            <Checkbox
              aria-label={title}
              checked={isChecked}
              onCheckedChange={(checked) => onCheckedChange?.(checked === true)}
            />
          </span>
        )}
        <span className="flex min-w-0 flex-1 items-center gap-2 text-sm leading-6 font-medium">
          {icon && (
            <span className="flex shrink-0 text-foreground [&_svg]:size-4">
              {icon}
            </span>
          )}
          {editor ? (
            <span className="min-w-0 flex-1 font-normal">{editor}</span>
          ) : (
            <>
              <span className="truncate text-foreground">{title}</span>
              {count && (
                <span className="shrink-0 text-muted-foreground">{count}</span>
              )}
            </>
          )}
        </span>
      </div>
      {!editor && actions && (
        <div className="flex shrink-0 items-center gap-3">{actions}</div>
      )}
    </div>
  );
}
