import { useEffect } from "react";

import { EmptyState } from "@/shared/components/empty-state";
import { ListPagination } from "@/shared/components/list-filter";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import type { ReactNode } from "react";

interface PagedListView<T> {
  records: T[];
  totalCount: number;
  totalPages: number;
}

interface HistoryPagedListProps<T> {
  list: PagedListView<T> | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  page: number;
  onChangePage: (page: number) => void;
  /** 범위를 벗어난 쪽을 마지막 쪽으로 당김(기록은 쌓지 않음). */
  onClampPage: (lastPage: number) => void;
  buildPageHref: (page: number) => string;
  skeleton: ReactNode;
  /** 0건일 때 목록 자리에 그릴 안내. */
  emptyContent: ReactNode;
  /** 0건일 때 목록 묶음에 더할 클래스(최대 높이). */
  emptyClassName?: string;
  /** PC는 표, TAB은 2열 카드. */
  isTable: boolean;
  renderTable: (records: T[], emptyContent: ReactNode | undefined) => ReactNode;
  renderCards: (records: T[]) => ReactNode;
}

// 충전/출금·사용 내역의 쪽 나눔 목록(PC·TAB). 쪽은 URL 쿼리가 소유하고 쪽 나눔은 서버가 함.
export function HistoryPagedList<T>({
  list,
  isLoading,
  isError,
  onRetry,
  page,
  onChangePage,
  onClampPage,
  buildPageHref,
  skeleton,
  emptyContent,
  emptyClassName,
  isTable,
  renderTable,
  renderCards,
}: HistoryPagedListProps<T>) {
  const { t: tCommon } = useTranslation();
  const totalPages = list?.totalPages ?? 0;
  // 주소를 직접 고쳐 범위를 벗어난 쪽은 마지막 쪽으로 당김.
  const isPageOutOfRange =
    list !== undefined && totalPages > 0 && page > totalPages;
  useEffect(() => {
    if (isPageOutOfRange) onClampPage(totalPages);
  }, [isPageOutOfRange, totalPages, onClampPage]);

  if (isLoading) return skeleton;
  if (isError || !list) {
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

  const empty = list.totalCount === 0 ? emptyContent : undefined;

  return (
    // 표(또는 카드)와 쪽 이동은 12px 간격으로 한 묶음(시안). 빈 상태가 남은 높이를 채우도록 늘어남.
    <div className={cn("flex flex-1 flex-col gap-3", empty && emptyClassName)}>
      {isTable
        ? renderTable(list.records, empty)
        : (empty ?? renderCards(list.records))}
      <ListPagination
        page={page}
        totalPages={totalPages}
        totalCount={list.totalCount}
        buildHref={buildPageHref}
        onChangePage={onChangePage}
      />
    </div>
  );
}
