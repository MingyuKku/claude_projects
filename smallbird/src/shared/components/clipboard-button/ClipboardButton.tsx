import { Copy } from "lucide-react";
import { tryit } from "radash";

import { cn } from "@/shared/lib/utils";

import type { ComponentProps } from "react";

// Figma Button / Clip Board(6766:45668): 왼쪽 라벨, 오른쪽 복사할 값. 누르면 값을 클립보드에 복사함.
// Figma 테두리는 패딩 안쪽에 겹쳐 그려져, CSS에서는 패딩을 1px씩 줄여야 시안 크기(높이 32, MO는 leading-5 = 16이라 28)와 같음.
// 누르면 복사하는 버튼이라 onClick·type 을 바깥에서 바꾸지 못하게 막음.
interface ClipboardButtonProps extends Omit<
  ComponentProps<"button">,
  "value" | "children" | "onClick" | "type"
> {
  label: string;
  value: string;
  /** 값 앞 복사 아이콘. 컴포넌트 원본에는 있고 고객센터 상세 정보(6766:45712)처럼 숨긴 시안도 있습니다. */
  hasValueIcon?: boolean;
  onCopyValue?: (value: string) => void;
  /** 권한 거부·비보안 컨텍스트 등으로 복사하지 못했을 때. 사용자 알림은 소비처가 띄움. */
  onCopyError?: (error: Error) => void;
}

export function ClipboardButton({
  label,
  value,
  hasValueIcon = true,
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
        "flex min-w-16 items-center gap-2 overflow-hidden rounded-md border border-border bg-background px-1.75 py-1.25 text-xs leading-4 font-medium outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tablet:leading-5",
        className,
      )}
      {...props}
    >
      <span className="flex min-w-0 flex-1 items-center gap-1 text-muted-foreground">
        <Copy aria-hidden="true" className="size-4 shrink-0" />
        <span className="truncate text-left">{label}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-foreground">
        {hasValueIcon && (
          <Copy
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground"
          />
        )}
        {value}
      </span>
    </button>
  );
}
