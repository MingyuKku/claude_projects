import { ArrowUp, Paperclip } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { FileDropHint } from "./FileDropHint";
import { fieldTextareaClassName } from "./styles";
import { useTextLength } from "./useTextLength";

import type { ComponentProps, ReactNode } from "react";

// Figma Text Field / Chatbot(6977:43438).
// 한 줄(Default~Filled): 첨부 · 입력 · 전송. 전송은 포커스 중이거나 내용이 있을 때만 보임.
// 펼침(Filled-Full): 썸네일 줄 · 여러 줄 입력 · 하단 첨부/전송. 첨부가 있으면 자동으로 펼침.
// 한 줄 모드의 전송 버튼은 Figma 시안대로 입력창에 포커스가 올 때만 나타남(의도한 동작).
// Tab으로 입력창에 들어오면 곧바로 보이므로 키보드 사용에는 문제가 없음.
interface ChatbotTextFieldProps extends Omit<
  ComponentProps<"textarea">,
  "children"
> {
  attachLabel: string;
  submitLabel: string;
  onClickAttach?: () => void;
  onClickSubmit?: () => void;
  attachments?: ReactNode;
  isExpanded?: boolean;
  isDragging?: boolean;
  dropTitle?: string;
  dropDescription?: string;
}

export function ChatbotTextField({
  attachLabel,
  submitLabel,
  onClickAttach,
  onClickSubmit,
  attachments,
  isExpanded = false,
  isDragging = false,
  dropTitle = "",
  dropDescription,
  className,
  value,
  defaultValue,
  onChange,
  ...props
}: ChatbotTextFieldProps) {
  const { length, handleChange } = useTextLength({
    value,
    defaultValue,
    onChange,
  });
  const base =
    "group/chatbot flex w-full gap-1.5 rounded-md border border-input bg-background";

  if (isDragging) {
    return (
      <div
        className={cn(
          base,
          "h-32.5 flex-col items-center justify-center p-5 ring-2 ring-primary ring-offset-2",
          className,
        )}
      >
        <FileDropHint
          title={dropTitle}
          description={dropDescription}
          iconClassName="size-5"
        />
      </div>
    );
  }

  const isMultiline = isExpanded || Boolean(attachments);
  const attachButton = (
    <Button
      variant="ghost-muted"
      size="icon-xs"
      aria-label={attachLabel}
      onClick={onClickAttach}
    >
      <Paperclip />
    </Button>
  );
  const submitButton = (
    <Button
      size="icon-xs"
      aria-label={submitLabel}
      onClick={onClickSubmit}
      className={cn(
        !isMultiline &&
          length === 0 &&
          "hidden group-focus-within/chatbot:inline-flex group-has-focus-visible/chatbot:inline-flex",
      )}
    >
      <ArrowUp />
    </Button>
  );
  const textarea = (
    <textarea
      {...props}
      value={value}
      defaultValue={defaultValue}
      onChange={handleChange}
      rows={1}
      className={cn(
        fieldTextareaClassName,
        isMultiline ? "h-17 overflow-y-auto" : "h-5 flex-1 overflow-hidden",
      )}
    />
  );

  if (!isMultiline) {
    return (
      <div className={cn(base, "items-center p-2", className)}>
        {attachButton}
        {textarea}
        {submitButton}
      </div>
    );
  }

  return (
    <div className={cn(base, "flex-col items-start px-3 py-2.5", className)}>
      {attachments && (
        <div className="grid w-full grid-cols-4 gap-1">{attachments}</div>
      )}
      {textarea}
      <div className="flex w-full items-center justify-between">
        {attachButton}
        {submitButton}
      </div>
    </div>
  );
}
