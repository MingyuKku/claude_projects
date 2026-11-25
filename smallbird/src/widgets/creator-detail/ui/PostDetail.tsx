import { ChevronLeft } from "lucide-react";

import {
  CreatorScrollArea,
  LoadError,
  focusOnMount,
  useCreatorFeedDetail,
} from "@/entities/creator";
import { SubHeader } from "@/shared/components/app-header";
import { SnsIcon, SnsMetricList } from "@/shared/components/cards";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";

import { formatPostDate, getPostMetrics, splitHashtags } from "../lib/feed";
import { PostComments } from "./PostComments";
import { PostMediaGallery } from "./PostMediaGallery";
import { TabLoading } from "./TabStatus";

import type {
  CreatorFeedTarget,
  MatchingPlatformCode,
} from "@/entities/creator";

interface PostDetailProps {
  target: CreatorFeedTarget;
  platformCode: MatchingPlatformCode;
  author: string;
  onClickBack: () => void;
}

// PC는 미디어와 글이 나란히 같은 높이이고 글만 안에서 스크롤함. TAB·MO는 위아래로 이어짐.
export function PostDetail({
  target,
  platformCode,
  author,
  onClickBack,
}: PostDetailProps) {
  const { t } = useTranslation("widgets/creator-detail");
  const { post, isLoading, isError, reload } = useCreatorFeedDetail(target);

  function renderBody() {
    if (isError) return <LoadError onClickRetry={() => void reload()} />;
    if (isLoading || !post) return <TabLoading className="h-160 w-full" />;

    const { text, hashtags } = splitHashtags(post.content);
    return (
      <div className="flex flex-col ds-gap-5 desktop:h-160 desktop:flex-row">
        {post.mediaUrls.length > 0 && (
          <PostMediaGallery urls={post.mediaUrls} isVideo={post.isVideo} />
        )}
        <section className="flex min-w-0 flex-col rounded-lg border bg-background desktop:flex-1">
          <header className="flex h-15 shrink-0 items-center justify-between border-b ds-px-5">
            <p className="flex min-w-0 items-center gap-2 ds-text-sm-5-semibold text-foreground">
              <SnsIcon platform={platformCode} className="size-5" />
              <span className="truncate">{author}</span>
            </p>
            <time
              dateTime={post.articleDate ?? undefined}
              className="ds-text-xs-4-normal text-muted-foreground"
            >
              {formatPostDate(post.articleDate)}
            </time>
          </header>
          <div className="shrink-0 ds-px-5 py-3.5">
            <SnsMetricList
              platform={platformCode}
              metrics={getPostMetrics(post)}
            />
          </div>
          <CreatorScrollArea
            className="flex-1"
            contentClassName="flex flex-col ds-gap-4 ds-px-5 ds-pb-5"
          >
            <div className="flex flex-col ds-gap-3">
              {text && (
                <p className="ds-text-sm-5-normal wrap-anywhere whitespace-pre-line text-foreground">
                  {text}
                </p>
              )}
              {hashtags.length > 0 && (
                <p className="flex flex-wrap gap-x-2 gap-y-1 ds-text-sm-5-normal text-primary">
                  {hashtags.map((tag, index) => (
                    <span key={`${tag}-${index}`}>{tag}</span>
                  ))}
                </p>
              )}
            </div>
            <Separator />
            <PostComments target={target} count={post.commentCount} />
          </CreatorScrollArea>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col tablet:gap-3">
      <SubHeader
        className="-mx-4 h-15 w-auto border-b-0 tablet:mx-0"
        title={
          <>
            <Button
              ref={focusOnMount}
              variant="outline-foreground"
              size="icon-sm"
              aria-label={t("feed.back")}
              onClick={onClickBack}
            >
              <ChevronLeft />
            </Button>
            <h3 className="truncate max-tablet:-ml-1">{t("feed.back")}</h3>
          </>
        }
      />
      {renderBody()}
    </div>
  );
}
