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
const itemVariants = cva(
  "group relative flex w-full flex-col items-start px-5 pt-4 pb-5",
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
  return splitByKeyword(text, keyword).map((segment, index) =>
    segment.isMatch ? (
      // 조각은 원문 위치 순서가 고정이라 인덱스 key로 충분함.
      <mark key={index} className="bg-blue-50 font-semibold text-primary">
        {segment.text}
      </mark>
    ) : (
      segment.text
    ),
  );
}

function AlertDot({ label }: { label?: string }) {
  return (
    <span className="mt-1 size-2 shrink-0 rounded-full bg-blue-500">
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
  const accessibleName = user?.name ?? title;

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
              <Badge key={badge.label} variant={badge.variant}>
                {badge.label}
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
              <p className="min-w-0 flex-1 truncate text-base leading-none font-semibold text-card-foreground">
                <HighlightedText text={user.name} keyword={highlight} />
              </p>
              {hasAlert && <AlertDot label={alertLabel} />}
            </div>
            {preview && (
              <p className="truncate text-sm leading-5 text-card-foreground">
                <HighlightedText text={preview} keyword={highlight} />
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="pointer-events-none flex w-full items-center gap-2.5 pl-2">
          <p className="min-w-0 flex-1 truncate text-base leading-7 font-semibold text-card-foreground">
            {title && <HighlightedText text={title} keyword={highlight} />}
          </p>
          {hasAlert && <AlertDot label={alertLabel} />}
        </div>
      )}
    </li>
  );
}
