import { SnsPostCard } from "@/shared/components/cards";

import { formatPostDate, getPostMetrics } from "../lib/feed";

import type { CreatorFeedPost, MatchingPlatformCode } from "@/entities/creator";

// 이미지가 없는 게시물은 공용 카드의 회색 바탕만 보임.
const BLANK_IMAGE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

interface FeedCardProps {
  post: CreatorFeedPost;
  platformCode: MatchingPlatformCode;
  author: string;
  onClick: () => void;
}

export function FeedCard({
  post,
  platformCode,
  author,
  onClick,
}: FeedCardProps) {
  const { content } = post;
  const date = formatPostDate(post.articleDate);
  // 시안: 유튜브는 제목만 보임. 제목이 없으면(크롤링 게시물) 본문을 제목 자리에 보임.
  // 시안: X·블로그 본문은 3줄, 나머지는 2줄.
  const isLongText = platformCode === "x" || platformCode === "naver";
  const isTitleOnly = platformCode === "youtube";
  const title = isTitleOnly ? (post.title ?? content) : post.title;

  return (
    <li className="relative">
      <SnsPostCard
        className="w-full"
        platform={platformCode}
        author={author}
        title={title}
        text={
          isTitleOnly ? undefined : (
            <span className={isLongText ? "line-clamp-3" : "line-clamp-2"}>
              {content}
            </span>
          )
        }
        imageSrc={post.thumbnailUrl ?? BLANK_IMAGE}
        imageAlt=""
        isVideo={post.isVideo}
        metrics={getPostMetrics(post)}
        date={date}
      />
      <button
        type="button"
        aria-label={
          [title, isTitleOnly ? null : content, date]
            .filter(Boolean)
            .join(" ") || author
        }
        className="absolute inset-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onClick={onClick}
      />
    </li>
  );
}
