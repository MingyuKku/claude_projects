import { useMediaQuery } from "@/shared/lib/useMediaQuery";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

import { MessageBubble } from "./MessageBubble";

import type { MessageSide, MessageSize } from "./MessageBubble";
import type { ReactNode } from "react";

// 마우스처럼 hover할 수 없는 기기(터치)인지.
const TOUCH_QUERY = "(hover: none)";

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
  /** 말풍선 hover 시 위에 뜨는 아이콘 버튼 묶음(답장·수정·삭제). hover가 없는 기기(터치)에서는 말풍선을 누르면 열립니다. */
  toolbar?: ReactNode;
  /** 아바타와 이름·말풍선 묶음 사이 간격(기본 8px). 화면마다 시안이 달라 바깥에서 덮어씁니다. */
  rowClassName?: string;
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
  rowClassName,
  className,
}: ChatMessageProps) {
  const isMe = side === "me";
  const isTouch = useMediaQuery(TOUCH_QUERY);
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

  // 시안은 hover 툴바. Radix Tooltip은 터치로 열리지 않아, hover 없는 기기에서는 같은 툴바를
  // 말풍선을 누르면 열리는 Popover로 보여 줌(사용자 결정 2026-10-21). 말풍선에 포커스해 Enter·Space로도 열림.
  // 알려진 한계: hover 기기에서 키보드로는 아직 못 엶
  const bubbleWithToolbar =
    toolbar && bubble && isTouch ? (
      <Popover>
        <PopoverTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.currentTarget.click();
              }
            }}
          >
            {bubble}
          </div>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align={isMe ? "end" : "start"}
          className="flex w-fit items-center rounded-lg p-1"
        >
          {toolbar}
        </PopoverContent>
      </Popover>
    ) : toolbar && bubble ? (
      <TooltipProvider>
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
      </TooltipProvider>
    ) : (
      bubble
    );

  // Figma는 이름 줄 높이 14(leading-none)인데, 말줄임(overflow hidden)이 g·y 같은 영문 아래 획을 자릅니다.
  // 위아래 2px 여유를 주고 같은 만큼 바깥 여백을 빼서 배치는 시안과 같게 둡니다.
  const nameText = (
    <p
      className={cn(
        "-my-0.5 truncate py-0.5 text-sm leading-none font-medium text-foreground",
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
          rowClassName,
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
