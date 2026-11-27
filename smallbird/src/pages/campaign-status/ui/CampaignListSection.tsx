import { EmptyState } from "@/shared/components/empty-state";
import {
  InfiniteScrollSentinel,
  LoadMoreSpinner,
  ScrollToTopButton,
} from "@/shared/components/infinite-list";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { CampaignCardList } from "./CampaignCardList";
import { CampaignListSkeleton } from "./CampaignListSkeleton";
import { CampaignTable } from "./CampaignTable";

import type { ShortcutKind } from "../lib/campaign-actions";
import type { CampaignSummary } from "@/entities/campaign";
import type { ReactNode } from "react";

interface RowHandlers {
  isSubAccount: boolean;
  onClickShortcut: (campaign: CampaignSummary, kind: ShortcutKind) => void;
  onClickDetail: (campaign: CampaignSummary) => void;
  onDeleted: () => void;
}

interface ScrollListView {
  records: CampaignSummary[];
  totalCount: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isError: boolean;
  isLoadMoreError: boolean;
  loadMore: () => void;
  reload: () => unknown;
}

interface CampaignListSectionProps extends RowHandlers {
  isTabletUp: boolean;
  isDesktop: boolean;
  scroll: ScrollListView;
  /** 0건일 때 목록 자리에 그릴 안내. */
  emptyContent: ReactNode;
}

function LoadFailed({
  onRetry,
  className,
}: {
  onRetry: () => void;
  className?: string;
}) {
  const { t } = useTranslation("pages/campaign-status");
  const { t: tCommon } = useTranslation();

  return (
    <EmptyState
      type="alarm"
      title={t("error.list")}
      className={className ?? "py-20"}
      action={
        <Button variant="outline" onClick={onRetry}>
          {tCommon("action.retry")}
        </Button>
      }
    />
  );
}

// 목록 본문. 끝까지 스크롤하면 다음 묶음을 이어 붙임. PC는 표, TAB·MO는 카드.
export function CampaignListSection({
  isTabletUp,
  isDesktop,
  scroll,
  emptyContent,
  ...rowHandlers
}: CampaignListSectionProps) {
  const { t: tCommon } = useTranslation();

  if (scroll.isLoading) return <CampaignListSkeleton isTable={isDesktop} />;
  if (scroll.isError)
    return <LoadFailed onRetry={() => void scroll.reload()} />;
  const isEmpty = scroll.totalCount === 0;
  if (isEmpty && !isDesktop) {
    return <div className="flex flex-1 flex-col">{emptyContent}</div>;
  }

  return (
    <div
      className={
        isTabletUp ? "flex flex-1 flex-col gap-4" : "flex flex-col gap-5"
      }
    >
      {isDesktop ? (
        <CampaignTable
          records={scroll.records}
          emptyContent={isEmpty ? emptyContent : undefined}
          {...rowHandlers}
        />
      ) : (
        <CampaignCardList records={scroll.records} {...rowHandlers} />
      )}
      {scroll.isLoadingMore && <LoadMoreSpinner />}
      {scroll.isLoadMoreError && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => void scroll.reload()}>
            {tCommon("action.retry")}
          </Button>
        </div>
      )}
      {/* 표식이 계속 화면 안에 있으면 관찰자가 다시 알리지 못해, 읽은 건수가 바뀔 때마다 새로 그림. */}
      {scroll.hasMore && !scroll.isLoadMoreError && (
        <InfiniteScrollSentinel
          key={scroll.records.length}
          onReach={scroll.loadMore}
        />
      )}
      {!isTabletUp && <ScrollToTopButton label={tCommon("list.scrollTop")} />}
    </div>
  );
}
