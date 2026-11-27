import { Mail } from "lucide-react";
import { useState } from "react";

import {
  LoadError,
  CreatorPanel,
  creatorKey,
  useCreatorDetail,
  useCreatorFilterOptions,
  useCreatorLabels,
  useMatchingPlatforms,
  usePlatformName,
  useCreatorTerms,
} from "@/entities/creator";
import { EmptyState } from "@/shared/components/empty-state";
import { ScrollPanel } from "@/shared/components/scroll-panel";
import { ScrollableTabsList } from "@/shared/components/scrollable-tabs-list";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { CreatorProfileCard } from "./CreatorProfileCard";
import { FeedTab } from "./FeedTab";
import { IntroTab } from "./IntroTab";
import { MetricsTab } from "./MetricsTab";
import { PostDetail } from "./PostDetail";
import { TabEmpty, TabLoading } from "./TabStatus";

import type { ProfileLayout } from "./CreatorProfileCard";
import type {
  CreatorDetail,
  CreatorDetailTarget,
  CreatorFeedPost,
  CreatorTarget,
  CreatorViewModel,
} from "@/entities/creator";

const CONTENT_TABS = ["metrics", "intro", "feed", "creatorInfo"] as const;

// MO 시안의 탭은 공통보다 낮음.
const MOBILE_TAB_CLASS_NAME = "group-data-[variant=default]/tabs-list:py-1";

type ContentTab = (typeof CONTENT_TABS)[number];

interface CreatorDetailPanelProps {
  /** 목록에서 누른 크리에이터. 처음엔 이 플랫폼으로 엶. */
  creator: CreatorViewModel;
  layout: ProfileLayout;
  onClose: () => void;
  /** 즐겨찾기 저장·해제는 목록과 같은 흐름을 부르는 쪽이 띄움. */
  onClickBookmark: (creator: CreatorViewModel) => void;
  /** 없으면 제안 버튼은 비활성. */
  onClickPropose?: (creator: CreatorViewModel) => void;
}

// 다른 플랫폼 탭의 크리에이터는 목록 행이 없어 상세 값으로 저장 대상을 만듦(지표는 저장 창에서 쓰지 않음).
function toViewModel(detail: CreatorDetail): CreatorViewModel {
  return {
    key: creatorKey(detail.platformIdx, detail.platformId),
    platformIdx: detail.platformIdx,
    platformId: detail.platformId,
    categoryIdx: detail.categoryIdx,
    nickname: detail.nickname,
    profileImageUrl: detail.profileImageUrl,
    followerCount: null,
    brandIndex: null,
    groupBuyIndex: null,
    avgCommentWriterCount: null,
    expectedCost: null,
    isBookmarked: detail.isBookmarked,
    platformUrl: null,
  };
}

export function CreatorDetailPanel({
  creator,
  layout,
  onClose,
  onClickBookmark,
  onClickPropose,
}: CreatorDetailPanelProps) {
  const { t } = useTranslation("widgets/creator-detail");
  const { t: tCommon } = useTranslation();
  const { term } = useCreatorTerms();
  const originalTarget: CreatorDetailTarget = {
    platformIdx: creator.platformIdx,
    platformId: creator.platformId,
    categoryIdx: creator.categoryIdx,
  };
  const [target, setTarget] = useState(originalTarget);
  const [contentTab, setContentTab] = useState<ContentTab>("metrics");
  const [post, setPost] = useState<CreatorFeedPost | null>(null);
  const { detail, isLoading, isError, reload } = useCreatorDetail(target);
  // 다른 플랫폼을 읽는 동안에도 탭이 남도록 처음 연 플랫폼의 상세에서 가져옴.
  const { detail: originalDetail } = useCreatorDetail(originalTarget);
  const platformOptions = useMatchingPlatforms();
  const getPlatformName = usePlatformName();
  const { options } = useCreatorFilterOptions();
  const { findPlatform, findCategoryName } = useCreatorLabels();

  const platformCode = findPlatform(target.platformIdx)?.code;
  const isMobile = layout === "mobile";
  // MO는 게시물 상세가 헤더·프로필까지 덮음.
  const isPostFullScreen = isMobile && post !== null;
  const isOriginalPlatform = target.platformIdx === creator.platformIdx;
  const platforms = originalDetail?.platforms ?? [
    { platformIdx: creator.platformIdx, platformId: creator.platformId },
  ];

  function handleChangePlatform(value: string) {
    const next = platforms.find((item) => String(item.platformIdx) === value);
    if (!next) return;
    setTarget({ ...target, ...next });
    setPost(null);
  }

  function handleChangeContentTab(value: string) {
    const next = CONTENT_TABS.find((tab) => tab === value);
    if (next) setContentTab(next);
    setPost(null);
  }

  // 처음 연 플랫폼은 목록 행의 값(지표·채널 주소)을 그대로 씀.
  function getCurrentCreator(): CreatorViewModel | null {
    if (!detail) return null;
    return isOriginalPlatform
      ? { ...creator, isBookmarked: detail.isBookmarked }
      : toViewModel(detail);
  }

  function handleClickBookmark() {
    const current = getCurrentCreator();
    if (current) onClickBookmark(current);
  }

  function handleClickPropose() {
    const current = getCurrentCreator();
    if (current) onClickPropose?.(current);
  }

  function renderFeed() {
    if (platformCode) {
      return (
        <FeedTab
          key={creatorKey(target.platformIdx, target.platformId)}
          target={target}
          platformCode={platformCode}
          post={isPostFullScreen ? null : post}
          isCovered={isPostFullScreen}
          onSelectPost={setPost}
        />
      );
    }
    if (platformOptions.isError) {
      return <LoadError onClickRetry={() => void platformOptions.reload()} />;
    }
    if (platformOptions.isLoading) {
      return <TabLoading className="h-110 w-full" />;
    }
    return <TabEmpty>{tCommon("status.comingSoon")}</TabEmpty>;
  }

  function renderPlatformName({ platformIdx, platformId }: CreatorTarget) {
    const platform = findPlatform(platformIdx);
    return platform ? getPlatformName(platform) : platformId;
  }

  function renderBody() {
    if (isError) return <LoadError onClickRetry={() => void reload()} />;
    if (isLoading || !detail) return <TabLoading className="h-28 w-full" />;
    return (
      <>
        <CreatorProfileCard
          detail={detail}
          layout={layout}
          platform={findPlatform(detail.platformIdx)}
          platformUrl={isOriginalPlatform ? creator.platformUrl : null}
          categoryName={findCategoryName(detail.categoryIdx)}
          serviceTypeName={
            options?.influencerServiceTypes.find(
              (item) => item.idx === detail.serviceTypeIdx,
            )?.name
          }
          onClickBookmark={handleClickBookmark}
        />
        <Tabs
          value={contentTab}
          onValueChange={handleChangeContentTab}
          className="grow ds-gap-5"
        >
          <TabsList className={isMobile ? "w-full justify-start" : undefined}>
            {CONTENT_TABS.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className={cn("flex-none", isMobile && MOBILE_TAB_CLASS_NAME)}
              >
                {t(`tab.${tab}`)}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="metrics">
            <MetricsTab target={target} />
          </TabsContent>
          <TabsContent value="intro">
            <IntroTab target={target} />
          </TabsContent>
          <TabsContent value="feed">{renderFeed()}</TabsContent>
          <TabsContent value="creatorInfo" className="flex">
            <EmptyState
              type="construction"
              title={tCommon("status.comingSoon")}
              className="flex-1 py-10"
            />
          </TabsContent>
        </Tabs>
      </>
    );
  }

  return (
    <div className="relative h-full">
      <div className="h-full" inert={isPostFullScreen}>
        <CreatorPanel title={t("title")} onClose={onClose}>
          <ScrollPanel
            className="flex-1"
            contentClassName={cn(
              "flex flex-col",
              isMobile ? "gap-4 px-4 pt-2" : "gap-5 px-5 pt-5",
            )}
          >
            <Tabs
              value={String(target.platformIdx)}
              onValueChange={handleChangePlatform}
            >
              <ScrollableTabsList variant="line" aria-label={term("platform")}>
                {platforms.map((item) => (
                  <TabsTrigger
                    key={item.platformIdx}
                    value={String(item.platformIdx)}
                    className="flex-none"
                  >
                    {renderPlatformName(item)}
                  </TabsTrigger>
                ))}
              </ScrollableTabsList>
            </Tabs>
            <div className="flex shrink-0 grow flex-col ds-gap-6 pb-5">
              {renderBody()}
            </div>
          </ScrollPanel>
          <footer className="flex shrink-0 justify-end ds-p-5">
            <Button
              className="h-9.5 desktop:h-10"
              disabled={!onClickPropose || !detail}
              onClick={handleClickPropose}
            >
              <Mail />
              {term("propose")}
            </Button>
          </footer>
        </CreatorPanel>
      </div>
      {isPostFullScreen && platformCode && (
        <div className="absolute inset-0 z-10 bg-background">
          <ScrollPanel className="h-full" contentClassName="px-4 pb-4">
            <PostDetail
              target={post}
              platformCode={platformCode}
              author={target.platformId}
              onClickBack={() => setPost(null)}
            />
          </ScrollPanel>
        </div>
      )}
    </div>
  );
}
