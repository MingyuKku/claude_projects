import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

import { MessageBubble } from "./MessageBubble";

import type { MessageSide, MessageSize } from "./MessageBubble";
import type { ReactNode } from "react";

// Figma Chat Base / Message Row(5198:102410). lg·md는 40px 아바타 옆에 이름·말풍선·첨부를 쌓고,
// sm은 32px 아바타 + 이름 줄 아래에 말풍선을 둠. Card는 행 위에 12px 간격으로 붙음.
interface ChatMessageProps {
  name: string;
  avatarSrc?: string;
  /** 메시지 본문. 텍스트로만 렌더링함. 첨부만 있는 메시지면 생략함. */
  message?: string;
  side?: MessageSide;
  size?: MessageSize;
  time?: string;
  editedLabel?: string;
  /** FileThumbnail·FileItem 묶음. */
  attachments?: ReactNode;
  /** 행 위에 붙는 카드(ChatCodeCard 등). */
  card?: ReactNode;
  /** 말풍선 hover 시 위에 뜨는 아이콘 버튼 묶음(답장·수정·삭제). */
  toolbar?: ReactNode;
  className?: string;
}

export function ChatMessage({
  name,
  avatarSrc,
  message,
  side = "other",
  size = "lg",
  time,
  editedLabel,
  attachments,
  card,
  toolbar,
  className,
}: ChatMessageProps) {
  const isMe = side === "me";
  const isSmall = size === "sm";
  const align = isMe ? "items-end" : "items-start";

  const avatar = (
    <Avatar size={isSmall ? "sm" : "md"}>
      {avatarSrc && <AvatarImage src={avatarSrc} alt="" />}
      <AvatarPlaceholder />
    </Avatar>
  );

  const bubble = message && (
    <MessageBubble
      message={message}
      side={side}
      size={size}
      time={time}
      editedLabel={editedLabel}
    />
  );

  // 알려진 한계: Figma 시안이 hover 툴바라 Tooltip으로 그리며, 트리거가 div라 키보드·터치로는 열 수 없음.
  // 실제 채팅 화면에 쓰기 전에 같은 동작(답장·수정·삭제)을 메뉴나 Popover로도 제공해야 함.
  const bubbleWithToolbar =
    toolbar && bubble ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <div>{bubble}</div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align={isMe ? "end" : "start"}
          variant="toolbar"
        >
          {toolbar}
        </TooltipContent>
      </Tooltip>
    ) : (
      bubble
    );

  const nameText = (
    <p
      className={cn(
        "truncate text-sm leading-none font-medium text-foreground",
        isMe && "text-right",
      )}
    >
      {name}
    </p>
  );

  if (isSmall) {
    return (
      <div className={cn("flex flex-col gap-3", align, className)}>
        {card}
        <div className={cn("flex flex-col gap-2", align)}>
          <div
            className={cn(
              "flex items-center gap-2",
              isMe && "flex-row-reverse",
            )}
          >
            {avatar}
            {nameText}
          </div>
          {bubbleWithToolbar}
        </div>
        {attachments}
      </div>
    );
  }

  // 카드만 있는 메시지(캠페인 카드)는 시안처럼 카드 하나만 그림. 말풍선 없는 이름·아바타 줄을 두지 않음.
  if (!bubble && !attachments) {
    return <div className={cn("flex flex-col", align, className)}>{card}</div>;
  }

  return (
    <div className={cn("flex flex-col gap-3", align, className)}>
      {card}
      {/* 첨부가 있으면 줄 자체를 가득 채움. 보낸 쪽 정렬(items-end) 안에서는 줄이 내용 폭으로 줄어들어 썸네일 격자가 말풍선 폭에 갇힘. */}
      <div
        className={cn(
          "flex items-start gap-2",
          isMe && "flex-row-reverse",
          attachments && "w-full",
        )}
      >
        {avatar}
        {/* 첨부가 있으면 행 폭을 다 써서 썸네일 격자가 줄어들지 않게 함. */}
        <div
          className={cn(
            "flex min-w-0 flex-col gap-2",
            align,
            attachments && "flex-1",
          )}
        >
          {nameText}
          {bubbleWithToolbar}
          {attachments}
        </div>
      </div>
    </div>
  );
}
