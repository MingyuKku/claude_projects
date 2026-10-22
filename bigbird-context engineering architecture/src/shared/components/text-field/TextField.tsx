import { cva } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

import { FileDropHint } from "./FileDropHint";
import { fieldTextareaClassName } from "./styles";
import { TextCounter } from "./TextCounter";
import { useTextLength } from "./useTextLength";

import type { ComponentProps, ReactNode } from "react";

// Figma Text Field / Default(5065:84064).
// variant: default = Type Default(그림자 있음), count = Type Text Count(그림자 없음, 글자 수 표시).
// isWide = Wide True(여러 줄 + 하단 도구줄). 상태(Focus·Filled)는 입력 자체의 상태라 별도 prop이 없음.
const textFieldVariants = cva(
  "relative flex w-full border border-input bg-background",
  {
    variants: {
      variant: {
        default: "shadow-lg",
        count: "",
      },
      isWide: {
        true: "flex-col items-start gap-1.5 rounded-md px-3 py-2.5",
        false: "items-center gap-4 rounded-lg p-2.5",
      },
    },
    defaultVariants: { variant: "default", isWide: false },
  },
);

const textareaVariants = cva("", {
  variants: {
    isWide: {
      true: "h-17 overflow-y-auto",
      false: "h-5 flex-1 overflow-hidden",
    },
  },
  defaultVariants: { isWide: false },
});

interface TextFieldProps extends Omit<ComponentProps<"textarea">, "children"> {
  variant?: "default" | "count";
  isWide?: boolean;
  // 플랫폼 선택(default)·첨부(count) 버튼
  leading?: ReactNode;
  // 검색·전송 버튼
  submit?: ReactNode;
  // Wide일 때 입력 위에 놓이는 첨부 썸네일 줄
  attachments?: ReactNode;
  // 입력 영역(textarea)에만 더하는 클래스. 높이를 글에 맞추는 사용처가 고정 높이(h-17)를 덮어쓸 때 씀.
  textareaClassName?: string;
  // Wide일 때 입력 영역(스크롤바 포함) 오른쪽 위에 놓는 버튼(예: 긴 글 펼치기). 입력 폭은 버튼 열(28px)만큼 줄어듦.
  // textarea를 감싸지 않고 위치만 잡는 이유는 wide 전환 때 textarea가 다시 만들어져 포커스와 한글 조합이 끊기지 않게 하기 위해서.
  inputAction?: ReactNode;
  // 파일을 끌어 올린 상태(Drag-Drop). 드래그 이벤트는 사용처에서 처리함.
  isDragging?: boolean;
  dropTitle?: string;
  dropDescription?: string;
}

export function TextField({
  variant = "default",
  isWide = false,
  leading,
  submit,
  attachments,
  textareaClassName,
  inputAction,
  isDragging = false,
  dropTitle = "",
  dropDescription,
  maxLength,
  className,
  value,
  defaultValue,
  onChange,
  ...props
}: TextFieldProps) {
  const { length, handleChange } = useTextLength({
    value,
    defaultValue,
    onChange,
  });

  if (isDragging) {
    return (
      <div
        className={cn(
          textFieldVariants({ variant, isWide: true }),
          "h-32.5 items-center justify-center py-3 shadow-none ring-2 ring-primary ring-offset-2",
          className,
        )}
      >
        <FileDropHint title={dropTitle} description={dropDescription} />
      </div>
    );
  }

  const counter = variant === "count" && maxLength !== undefined && (
    <TextCounter length={length} maxLength={maxLength} />
  );
  const textarea = (
    <textarea
      {...props}
      value={value}
      defaultValue={defaultValue}
      maxLength={maxLength}
      onChange={handleChange}
      rows={1}
      className={cn(
        fieldTextareaClassName,
        textareaVariants({ isWide }),
        // 펼치기 버튼(28px) 열을 비워 스크롤바가 버튼 왼쪽에 놓이게 함.
        isWide && inputAction && "max-w-[calc(100%-1.75rem)]",
        textareaClassName,
      )}
    />
  );

  if (!isWide) {
    return (
      <div className={cn(textFieldVariants({ variant, isWide }), className)}>
        {leading}
        {textarea}
        {counter}
        {submit}
      </div>
    );
  }

  return (
    <div className={cn(textFieldVariants({ variant, isWide }), className)}>
      {attachments && <div className="flex w-full gap-1">{attachments}</div>}
      {textarea}
      <div className="flex w-full items-center justify-between gap-4">
        {leading ?? <span />}
        <div className="flex items-center gap-4">
          {counter}
          {submit}
        </div>
      </div>
      {inputAction && (
        <div className="absolute top-2.5 right-3">{inputAction}</div>
      )}
    </div>
  );
}
