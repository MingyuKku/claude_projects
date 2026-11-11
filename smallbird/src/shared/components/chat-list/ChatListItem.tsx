import { cva } from "class-variance-authority";
import { Trash } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

import { splitByKeyword } from "./splitByKeyword";

import type { ComponentProps } from "react";

// Figma Chat List Base / Card(5198:100096 광고주 문의, 5198:113027 구매자 문의).
// Focus=True는 선택된 대화(bg-accent), Hover는 bg-accent/50 + 삭제 버튼, Highlighted는 검색어 강조.
// MO는 Figma 변수 모드가 p-5=16·leading-7=26이라 카드가 좌우·아래 16, 제목 줄 26(11315:49659 카드 94).
const itemVariants = cva(
  "group relative flex w-full flex-col items-start p-4 tablet:px-5 tablet:pb-5",
  {
    variants: {
      isSelected: {
        true: "bg-accent",
        false: "bg-card hover:bg-accent/50",
      },
      hasUser: {
        true: "gap-3",
        false: "gap-1.5",
      },
    },
    defaultVariants: { isSelected: false, hasUser: false },
  },
);

export interface ChatListBadge {
  label: string;
  variant: NonNullable<ComponentProps<typeof Badge>["variant"]>;
  /** 배지 폭 제한 등(예: `max-w-26`). 넘는 글자는 말줄임 처리됨. */
  className?: string;
}

interface ChatListItemUser {
  name: string;
  avatarSrc?: string;
}

interface ChatListItemBaseProps extends Omit<ComponentProps<"li">, "title"> {
  badges: ChatListBadge[];
  date: string;
  time?: string;
  preview?: string;
  /** 제목 앞 회색 접두(Figma 3.0.6 광고주 문의 카드의 "기타 문의", 구매자 문의 카드의 브랜드명). user 형태에서는 쓰지 않음. */
  titlePrefix?: string;
  /** 제목 아래 보조 줄(Figma 26/10/29 구매자 문의 카드의 "@작성자"). user 형태에서는 쓰지 않음. */
  caption?: string;
  /** 검색어. 제목·이름·미리보기에서 일치 구간을 강조함. */
  highlight?: string;
  hasAlert?: boolean;
  alertLabel?: string;
  isSelected?: boolean;
  onClickItem?: () => void;
}

// 카드 전체 버튼의 이름이 title 또는 user.name 이라 둘 중 하나는 필수이고,
// 삭제 버튼은 아이콘만 있어 onClickDelete 를 넘기면 deleteLabel 도 필수.
type ChatListItemProps = ChatListItemBaseProps &
  (
    | {
        /** 광고주 문의 카드의 제목. user가 있으면 무시됨. */
        title: string;
        /** 구매자 문의 카드의 작성자. 있으면 아바타·이름·미리보기 형태로 렌더링함. */
        user?: ChatListItemUser;
      }
    | { title?: string; user: ChatListItemUser }
  ) &
  (
    | { onClickDelete?: never; deleteLabel?: never }
    | { onClickDelete: () => void; deleteLabel: string }
  );

function HighlightedText({
  text,
  keyword,
}: {
  text: string;
  keyword?: string;
}) {
  const segments = splitByKeyword(text, keyword);
  // 굵기는 부모를 따름(제목 600, 캡션·미리보기 400). 계정명 앞 @ 는 시안처럼 강조 덩어리에 포함함.
  return segments.map((segment, index) => {
    if (segment.isMatch) {
      const previous = segments[index - 1];
      const hasHandlePrefix =
        !previous?.isMatch && previous?.text.endsWith("@");
      return (
        // 조각은 원문 위치 순서가 고정이라 인덱스 key로 충분함.
        <mark key={index} className="bg-blue-50 text-primary">
          {hasHandlePrefix ? "@" : ""}
          {segment.text}
        </mark>
      );
    }
    const isHandlePrefix =
      segments[index + 1]?.isMatch && segment.text.endsWith("@");
    return isHandlePrefix ? segment.text.slice(0, -1) : segment.text;
  });
}

function AlertDot({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span className={cn("size-2 shrink-0 rounded-full bg-blue-500", className)}>
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}

export function ChatListItem({
  badges,
  date,
  time,
  title,
  user,
  preview,
  titlePrefix,
  caption,
  highlight,
  hasAlert = false,
  alertLabel,
  isSelected = false,
  onClickItem,
  deleteLabel,
  onClickDelete,
  className,
  ...props
}: ChatListItemProps) {
  const hasUser = Boolean(user);
  // 제목 값이 아직 없는 카드(빅버드 기타 문의)는 배지 문구로 이름을 대신함.
  const accessibleName =
    user?.name ??
    ([titlePrefix, title, caption].filter(Boolean).join(" ") ||
      badges.map((badge) => badge.label).join(" "));

  return (
    <li
      className={cn(itemVariants({ isSelected, hasUser }), className)}
      {...props}
    >
      {/* 카드 전체를 누르는 버튼과 삭제 버튼이 중첩되지 않도록 덮개 버튼으로 둠. */}
      <button
        type="button"
        aria-label={accessibleName}
        aria-current={isSelected || undefined}
        onClick={onClickItem}
        className="absolute inset-0 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
      />
      <div className="pointer-events-none flex w-full items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {badges.map((badge) => (
              <Badge
                key={badge.label}
                variant={badge.variant}
                className={badge.className}
              >
                <span className="truncate">{badge.label}</span>
              </Badge>
            ))}
          </div>
          <p className="flex shrink-0 gap-1 text-xs leading-4 text-muted-foreground">
            <span>{date}</span>
            {time && <span>{time}</span>}
          </p>
        </div>
        {onClickDelete && (
          <Button
            variant="ghost-foreground"
            size="icon-xs"
            aria-label={deleteLabel}
            onClick={onClickDelete}
            className="pointer-events-auto relative hidden group-focus-within:inline-flex group-hover:inline-flex"
          >
            <Trash />
          </Button>
        )}
      </div>

      {user ? (
        <div className="pointer-events-none flex w-full items-start gap-2.5">
          <Avatar size="md">
            {user.avatarSrc && <AvatarImage src={user.avatarSrc} alt="" />}
            <AvatarPlaceholder />
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-start gap-2">
              <p className="-my-0.5 min-w-0 flex-1 truncate py-0.5 text-base leading-none font-semibold text-card-foreground">
                <HighlightedText text={user.name} keyword={highlight} />
              </p>
              {hasAlert && <AlertDot label={alertLabel} className="mt-1" />}
            </div>
            {preview && (
              <p className="truncate text-sm leading-5 text-card-foreground">
                <HighlightedText text={preview} keyword={highlight} />
              </p>
            )}
          </div>
        </div>
      ) : (
        // Figma Description: 접두·제목 Title Row가 각각 pl-2(8px)라 사이도 8px. 보조 줄(Caption)은 2px 아래 pl-2.
        <div className="pointer-events-none flex w-full flex-col gap-0.5">
          <div className="flex w-full items-center">
            {/* 시안에 접두 최대 폭이 없어, 긴 브랜드명이 제목을 다 밀어내지 않게 절반으로 제한함(임시). */}
            {titlePrefix && (
              <p className="max-w-1/2 shrink-0 truncate pl-2 text-base leading-6.5 font-semibold text-muted-foreground tablet:leading-7">
                <HighlightedText text={titlePrefix} keyword={highlight} />
              </p>
            )}
            <div className="flex min-w-0 flex-1 items-center gap-2 pl-2">
              <p className="min-w-0 flex-1 truncate text-base leading-6.5 font-semibold text-card-foreground tablet:leading-7">
                {title && <HighlightedText text={title} keyword={highlight} />}
              </p>
              {hasAlert && <AlertDot label={alertLabel} />}
            </div>
          </div>
          {caption && (
            <p className="truncate pl-2 text-sm leading-none text-card-foreground">
              <HighlightedText text={caption} keyword={highlight} />
            </p>
          )}
        </div>
      )}
    </li>
  );
}
