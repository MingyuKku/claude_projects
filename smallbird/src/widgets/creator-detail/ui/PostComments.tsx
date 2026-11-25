import { Heart } from "lucide-react";

import {
  LoadError,
  LoadMoreFooter,
  useCreatorFeedComments,
} from "@/entities/creator";
import { formatNumber, Trans, useTranslation } from "@/shared/i18n";
import { EMPTY_VALUE } from "@/shared/lib";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";

import { formatPostDate } from "../lib/feed";
import { TabLoading } from "./TabStatus";

import type { CreatorFeedTarget } from "@/entities/creator";

interface PostCommentsProps {
  target: CreatorFeedTarget;
  /** 게시물 전체 댓글 수. 모르면 읽은 댓글 수를 보임. */
  count: number | null | undefined;
}

export function PostComments({ target, count }: PostCommentsProps) {
  const { t } = useTranslation("widgets/creator-detail");
  const comments = useCreatorFeedComments(target);

  if (comments.isLoading) return <TabLoading className="h-20 w-full" />;
  if (comments.isError) {
    return <LoadError onClickRetry={() => void comments.reload()} />;
  }

  return (
    <>
      <p className="flex gap-1 ds-text-xs-4-normal text-foreground">
        <Trans
          t={t}
          i18nKey="feed.comments"
          values={{ value: formatNumber(count ?? comments.items.length) }}
          components={{
            em: <span className="ds-text-xs-4-semibold text-primary" />,
          }}
        />
      </p>
      <ul className="flex flex-col ds-gap-4">
        {comments.items.map((comment, index) => (
          // 서버가 댓글 id를 주지 않고, 목록은 뒤에 이어 붙기만 함.
          <li
            key={`${index}-${comment.commentDate}`}
            className="flex items-start gap-2"
          >
            <Avatar size="sm">
              {comment.avatarUrl && (
                <AvatarImage src={comment.avatarUrl} alt="" />
              )}
              <AvatarPlaceholder />
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="-mb-1 truncate pb-1 ds-text-sm-none-medium text-foreground">
                {comment.nickname ?? EMPTY_VALUE}
              </p>
              <p className="ds-text-sm-5-normal wrap-anywhere whitespace-pre-line text-foreground">
                {comment.content}
              </p>
              <time
                dateTime={comment.commentDate ?? undefined}
                className="ds-text-xs-4-normal text-muted-foreground"
              >
                {formatPostDate(comment.commentDate)}
              </time>
            </div>
            {comment.likeCount !== null && (
              <p className="ml-2 flex shrink-0 items-center gap-1 ds-text-xs-4-normal text-muted-foreground">
                <Heart aria-hidden className="size-4" />
                <span className="sr-only">{t("feed.likes")}</span>
                {formatNumber(comment.likeCount)}
              </p>
            )}
          </li>
        ))}
      </ul>
      <LoadMoreFooter list={comments} />
    </>
  );
}
