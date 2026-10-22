import { cva } from "class-variance-authority";
import { Paperclip } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";

import type { ReactNode } from "react";

// Figma Chat Base / Message Bubble Edit(6790:116227): 내 메시지를 그 자리에서 고치는 편집 말풍선.
const editorVariants = cva("flex items-start gap-2", {
  variants: {
    size: {
      md: "w-125",
      sm: "w-98",
    },
  },
  defaultVariants: { size: "md" },
});

interface MessageEditorProps {
  name: string;
  avatarSrc?: string;
  value: string;
  onChangeValue: (value: string) => void;
  maxLength: number;
  inputLabel: string;
  size?: "md" | "sm";
  attachments?: ReactNode;
  attachLabel: string;
  onClickAttach?: () => void;
  cancelLabel: string;
  onClickCancel?: () => void;
  submitLabel: string;
  onClickSubmit?: () => void;
  className?: string;
}

export function MessageEditor({
  name,
  avatarSrc,
  value,
  onChangeValue,
  maxLength,
  inputLabel,
  size,
  attachments,
  attachLabel,
  onClickAttach,
  cancelLabel,
  onClickCancel,
  submitLabel,
  onClickSubmit,
  className,
}: MessageEditorProps) {
  return (
    <div className={cn(editorVariants({ size }), className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="truncate text-right text-sm leading-none font-medium text-foreground">
          {name}
        </p>
        <div className="flex flex-col rounded-lg bg-background">
          <div className="flex flex-col gap-2 px-3.5 py-2">
            {attachments}
            <textarea
              aria-label={inputLabel}
              value={value}
              maxLength={maxLength}
              onChange={(event) => onChangeValue(event.target.value)}
              className="field-sizing-content resize-none bg-transparent text-sm leading-5 text-foreground outline-none"
            />
          </div>
          <div className="flex items-center justify-between px-3 py-2.5">
            <Button
              variant="outline-muted"
              size="sm"
              onClick={onClickAttach}
              className="pr-2 pl-3"
            >
              <Paperclip />
              {attachLabel}
            </Button>
            <div className="flex items-center gap-4">
              <p className="flex gap-1 text-xs leading-4 text-muted-foreground">
                <span className="text-foreground">{value.length}</span>
                <span>/</span>
                <span>{maxLength}</span>
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onClickCancel}>
                  {cancelLabel}
                </Button>
                <Button size="sm" onClick={onClickSubmit}>
                  {submitLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Avatar size="md">
        {avatarSrc && <AvatarImage src={avatarSrc} alt="" />}
        <AvatarPlaceholder />
      </Avatar>
    </div>
  );
}
