import { useRef } from "react";

import { LoadError, LoadMoreFooter, useCreatorFeed } from "@/entities/creator";
import { useTranslation } from "@/shared/i18n";

import { FeedCard } from "./FeedCard";
import { PostDetail } from "./PostDetail";
import { TabEmpty, TabLoading } from "./TabStatus";

import type {
  CreatorFeedPost,
  CreatorTarget,
  MatchingPlatformCode,
} from "@/entities/creator";

interface FeedTabProps {
  target: CreatorTarget;
  platformCode: MatchingPlatformCode;
  /** 탭 안에서 보는 게시물. null이면 목록. */
  post: CreatorFeedPost | null;
  /** MO에서 게시물 상세가 목록을 덮고 있음. */
  isCovered: boolean;
  onSelectPost: (post: CreatorFeedPost | null) => void;
}

// 게시물 상세는 탭 안에서 목록 자리를 대신하고, 돌아오면 눌렀던 카드로 초점을 되돌려 보던 자리를 지킴.
export function FeedTab({
  target,
  platformCode,
  post,
  isCovered,
  onSelectPost,
}: FeedTabProps) {
  const { t } = useTranslation("widgets/creator-detail");
  const feed = useCreatorFeed(target);
  const lastUrlRef = useRef<string | null>(null);

  function handleClickPost(next: CreatorFeedPost) {
    lastUrlRef.current = next.articleUrl;
    onSelectPost(next);
  }

  function focusLastCard(list: HTMLUListElement | null) {
    if (!list || isCovered || !lastUrlRef.current) return;
    const index = feed.items.findIndex(
      (item) => item.articleUrl === lastUrlRef.current,
    );
    lastUrlRef.current = null;
    list.querySelectorAll<HTMLElement>("li > button")[index]?.focus();
  }

  if (post) {
    return (
      <PostDetail
        target={post}
        platformCode={platformCode}
        author={target.platformId}
        onClickBack={() => onSelectPost(null)}
      />
    );
  }
  if (feed.isLoading) return <TabLoading className="h-110 w-full" />;
  if (feed.isError)
    return <LoadError onClickRetry={() => void feed.reload()} />;
  if (feed.items.length === 0) return <TabEmpty>{t("feed.empty")}</TabEmpty>;

  return (
    <>
      <ul
        ref={focusLastCard}
        className="grid grid-cols-1 ds-gap-5 tablet:grid-cols-2 desktop:grid-cols-3"
      >
        {feed.items.map((item) => (
          <FeedCard
            key={item.articleUrl}
            post={item}
            platformCode={platformCode}
            author={target.platformId}
            onClick={() => handleClickPost(item)}
          />
        ))}
      </ul>
      <LoadMoreFooter list={feed} />
    </>
  );
}
