import { EmptyState } from "@/shared/components/empty-state";
import {
  InfiniteScrollSentinel,
  ScrollToTopButton,
} from "@/shared/components/infinite-list";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import type { ReactNode } from "react";

interface HistoryScrollListProps<T> {
  records: T[];
  totalCount: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isError: boolean;
  /** 이어 읽기에 실패함(먼저 읽은 목록은 남아 있음). */
  isLoadMoreError: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  skeleton: ReactNode;
  /** 0건일 때 목록 자리에 그릴 안내. */
  emptyContent: ReactNode;
  /** 0건일 때 안내를 감싸는 묶음에 더할 클래스(최대 높이). */
  emptyClassName?: string;
  renderCards: (records: T[]) => ReactNode;
}

// 충전/출금·사용 내역의 MO 목록: 쪽 이동 없이 스크롤 끝에서 다음 쪽을 이어 읽고 "맨 위로" 버튼을 둠(스펙 §3, 시안 FAB).
export function HistoryScrollList<T>({
  records,
  totalCount,
  hasMore,
  isLoading,
  isLoadingMore,
  isError,
  isLoadMoreError,
  onLoadMore,
  onRetry,
  skeleton,
  emptyContent,
  emptyClassName,
  renderCards,
}: HistoryScrollListProps<T>) {
  const { t: tCommon } = useTranslation();

  if (isLoading) return skeleton;
  if (isError) {
    return (
      <EmptyState
        type="alarm"
        title={tCommon("error.unexpected")}
        className="py-20"
        action={
          <Button variant="outline" onClick={onRetry}>
            {tCommon("action.retry")}
          </Button>
        }
      />
    );
  }
  if (totalCount === 0) {
    return (
      <div className={cn("flex flex-1 flex-col", emptyClassName)}>
        {emptyContent}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {renderCards(records)}
      {isLoadingMore && (
        <div role="status" aria-label={tCommon("status.loading")}>
          <Skeleton className="h-12 w-full" />
        </div>
      )}
      {isLoadMoreError && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={onRetry}>
            {tCommon("action.retry")}
          </Button>
        </div>
      )}
      {/* 표식이 계속 화면 안에 있으면 관찰자가 다시 알리지 못해, 읽은 건수가 바뀔 때마다 새로 그림. */}
      {hasMore && !isLoadMoreError && (
        <InfiniteScrollSentinel key={records.length} onReach={onLoadMore} />
      )}
      <ScrollToTopButton label={tCommon("list.scrollTop")} />
    </div>
  );
}
