import { X } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { fieldTextareaClassName } from "./styles";
import { TextCounter } from "./TextCounter";
import { useTextLength } from "./useTextLength";

import type { ComponentProps, ReactNode } from "react";

// Figma Text Field / Reply(6766:52659). 위: 답장 대상(썸네일·받는 사람·원문), 아래: 답장 입력.
interface ReplyTextFieldProps extends Omit<
  ComponentProps<"textarea">,
  "children"
> {
  recipient: string;
  quote: string;
  // 42px 썸네일(Thumbnail True)
  thumbnail?: ReactNode;
  closeLabel: string;
  onClickClose?: () => void;
  submit?: ReactNode;
}

export function ReplyTextField({
  recipient,
  quote,
  thumbnail,
  closeLabel,
  onClickClose,
  submit,
  maxLength,
  className,
  value,
  defaultValue,
  onChange,
  ...props
}: ReplyTextFieldProps) {
  const { length, handleChange } = useTextLength({
    value,
    defaultValue,
    onChange,
  });

  return (
    <div className={cn("flex w-full flex-col", className)}>
      <div
        className={cn(
          "flex items-start rounded-t-md border-x border-t border-input bg-background px-3 py-2.5",
          thumbnail ? "gap-2" : "gap-0.5",
        )}
      >
        {thumbnail}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm leading-5 text-foreground">
          <p className="truncate font-semibold">{recipient}</p>
          <p className="truncate">{quote}</p>
        </div>
        <Button
          variant="ghost-foreground"
          size="icon-xss"
          aria-label={closeLabel}
          onClick={onClickClose}
        >
          <X />
        </Button>
      </div>
      <div className="flex flex-col items-end gap-1.5 rounded-b-md border border-input bg-background px-3 py-2.5">
        <textarea
          {...props}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          onChange={handleChange}
          className={cn(fieldTextareaClassName, "h-17 overflow-y-auto")}
        />
        <div className="flex items-center gap-4">
          {maxLength !== undefined && (
            <TextCounter length={length} maxLength={maxLength} />
          )}
          {submit}
        </div>
      </div>
    </div>
  );
}
