import { Plus } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { ComponentProps, ReactNode } from "react";

// Figma Card / Pay(7064:181566): 등록된 결제 카드(Default)와 카드 추가 버튼(Add), 186 × 100.
// Default의 Hover는 투명도 80%, Focus는 공통 포커스 링(Figma Focus 예시는 기본 카드 배지를 함께 보여 줌).
// 카드 안에 메뉴 버튼이 있어 통째로 button으로 만들지 않음. 카드 전체를 누르게 쓸 때는 소비처가
// tabIndex·키보드 처리를 넣어야 포커스 링이 동작함(InputCard는 안쪽 input 포커스로 이미 동작).
const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

interface PayCardProps extends ComponentProps<"div"> {
  name: ReactNode;
  number: ReactNode;
  /** 왼쪽 아래 배지(예: `<Badge size="sm">기본 카드</Badge>`) */
  badge?: ReactNode;
  /** 오른쪽 위 메뉴 버튼 자리(ellipsis-vertical 아이콘 버튼) */
  menu?: ReactNode;
}

export function PayCard({
  name,
  number,
  badge,
  menu,
  className,
  ...props
}: PayCardProps) {
  return (
    <div
      className={cn(
        "flex h-25 w-46.5 items-start gap-[7.2px] rounded-lg bg-linear-to-b from-slate-500 to-slate-400 p-3 text-primary-foreground transition-opacity hover:opacity-80",
        FOCUS_RING,
        className,
      )}
      {...props}
    >
      <div className="flex h-full min-w-0 flex-1 flex-col justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm leading-none font-semibold">{name}</p>
          <p className="text-xs leading-4">{number}</p>
        </div>
        {badge}
      </div>
      {menu}
    </div>
  );
}

interface PayCardAddButtonProps extends ComponentProps<"button"> {
  label: ReactNode;
}

export function PayCardAddButton({
  label,
  className,
  ...props
}: PayCardAddButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-25 w-46.5 items-center justify-center gap-1.5 rounded-lg border border-dashed bg-muted/50 text-sm leading-none text-muted-foreground transition-colors hover:bg-accent",
        FOCUS_RING,
        className,
      )}
      {...props}
    >
      <Plus aria-hidden className="size-5" />
      {label}
    </button>
  );
}
