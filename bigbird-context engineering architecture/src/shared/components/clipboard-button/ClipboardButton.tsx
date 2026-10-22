import { Copy } from "lucide-react";
import { tryit } from "radash";

import { cn } from "@/shared/lib/utils";

import type { ComponentProps } from "react";

// Figma Button / Clip Board(6766:45668): 왼쪽 라벨, 오른쪽 복사할 값. 누르면 값을 클립보드에 복사함.
// 누르면 복사하는 버튼이라 onClick·type 을 바깥에서 바꾸지 못하게 막음.
interface ClipboardButtonProps extends Omit<
  ComponentProps<"button">,
  "value" | "children" | "onClick" | "type"
> {
  label: string;
  value: string;
  onCopyValue?: (value: string) => void;
  /** 권한 거부·비보안 컨텍스트 등으로 복사하지 못했을 때. 사용자 알림은 소비처가 띄움. */
  onCopyError?: (error: Error) => void;
}

export function ClipboardButton({
  label,
  value,
  onCopyValue,
  onCopyError,
  className,
  ...props
}: ClipboardButtonProps) {
  async function handleClick() {
    const [error] = await tryit(() => navigator.clipboard.writeText(value))();
    if (error) {
      console.error("클립보드 복사 실패", error);
      onCopyError?.(error);
      return;
    }
    onCopyValue?.(value);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex min-w-16 items-center gap-2 overflow-hidden rounded-md border border-border bg-background px-2 py-1.5 text-xs leading-5 font-medium outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="flex min-w-0 flex-1 items-center gap-1 text-muted-foreground">
        <Copy aria-hidden="true" className="size-4 shrink-0" />
        <span className="truncate text-left">{label}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-foreground">
        <Copy
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
        {value}
      </span>
    </button>
  );
}
