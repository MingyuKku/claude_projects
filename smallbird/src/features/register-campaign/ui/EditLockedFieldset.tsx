import { cn } from "@/shared/lib/utils";

import type { ReactNode } from "react";

interface EditLockedFieldsetProps {
  isLocked: boolean;
  className?: string;
  children: ReactNode;
}

// 수정 모드에서 고칠 수 없는 입력을 읽기 전용으로 만드는 틀. `fieldset disabled`가 안의 버튼·입력·체크박스를 한꺼번에 막고,
// 값은 그대로 보임(흐리게 하지 않음). 잠기지 않았으면 레이아웃에 영향 없이 그대로 감쌈.
export function EditLockedFieldset({
  isLocked,
  className,
  children,
}: EditLockedFieldsetProps) {
  return (
    <fieldset
      disabled={isLocked}
      className={cn("m-0 min-w-0 border-0 p-0", className)}
    >
      {children}
    </fieldset>
  );
}
