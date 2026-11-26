import { useEffect } from "react";

import { EmptyState } from "@/shared/components/empty-state";
import {
  InfiniteScrollSentinel,
  LoadMoreSpinner,
  ScrollToTopButton,
} from "@/shared/components/infinite-list";
import { ListPagination } from "@/shared/components/list-filter";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { CampaignCardList } from "./CampaignCardList";
import { CampaignListSkeleton } from "./CampaignListSkeleton";
import { CampaignTable } from "./CampaignTable";

import type { ShortcutKind } from "../lib/campaign-actions";
import type { useStatusParams } from "../model/use-status-params";
import type { CampaignPage, CampaignSummary } from "@/entities/campaign";
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
  params: ReturnType<typeof useStatusParams>;
  isTabletUp: boolean;
  isDesktop: boolean;
  paged: {
    list: CampaignPage | undefined;
    isLoading: boolean;
    isError: boolean;
    mutate: () => unknown;
  };
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

// 목록 본문. PC·TAB은 한 쪽(쪽 이동), MO는 끝까지 스크롤하면 다음 쪽을 이어 붙임. 두 방식 중 폭에 맞는 한쪽만 읽음.
export function CampaignListSection({
  params,
  isTabletUp,
  isDesktop,
  paged,
  scroll,
  emptyContent,
  ...rowHandlers
}: CampaignListSectionProps) {
  const { t: tCommon } = useTranslation();
  const list = paged.list;
  const totalPages = list?.totalPages ?? 0;
  // 주소를 직접 고치거나 마지막 쪽의 항목을 지워 범위를 벗어난 쪽은 마지막 쪽으로 당김.
  const isPageOutOfRange =
    isTabletUp &&
    list !== undefined &&
    totalPages > 0 &&
    params.page > totalPages;
  const { clampPage } = params;
  useEffect(() => {
    if (isPageOutOfRange) clampPage(totalPages);
  }, [isPageOutOfRange, totalPages, clampPage]);

  if (isTabletUp) {
    if (paged.isLoading) return <CampaignListSkeleton isTable={isDesktop} />;
    if (paged.isError || !list) {
      return <LoadFailed onRetry={() => void paged.mutate()} />;
    }
    const empty = list.totalCount === 0 ? emptyContent : undefined;

    return (
      <div className="flex flex-1 flex-col gap-4">
        {isDesktop ? (
          <CampaignTable
            records={list.records}
            emptyContent={empty}
            {...rowHandlers}
          />
        ) : (
          (empty ?? (
            <CampaignCardList records={list.records} {...rowHandlers} />
          ))
        )}
        <div className="pt-2">
          <ListPagination
            page={params.page}
            totalPages={totalPages}
            totalCount={list.totalCount}
            buildHref={params.buildPageHref}
            onChangePage={params.setPage}
          />
        </div>
      </div>
    );
  }

  if (scroll.isLoading) return <CampaignListSkeleton isTable={false} />;
  if (scroll.isError)
    return <LoadFailed onRetry={() => void scroll.reload()} />;
  if (scroll.totalCount === 0) {
    return <div className="flex flex-1 flex-col">{emptyContent}</div>;
  }

  return (
    <div className="flex flex-col gap-5">
      <CampaignCardList records={scroll.records} {...rowHandlers} />
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
      <ScrollToTopButton label={tCommon("list.scrollTop")} />
    </div>
  );
}
