import { useEffect } from "react";

import { EmptyState } from "@/shared/components/empty-state";
import {
  FilterToolbar,
  hasActiveFilter,
  ListEmptyState,
  ListPagination,
  resolveEmptyKind,
} from "@/shared/components/list-filter";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib";
import { Button } from "@/shared/ui/button";

import { useUsageHistory } from "../api/use-usage-history";
import { useListParams } from "../lib/use-list-params";
import { useUsageFilterFields } from "../lib/use-usage-filter-fields";
import { TABLET_QUERY } from "../model/constants";
import { UsageCardList } from "./UsageCardList";
import { UsageListSkeleton } from "./UsageListSkeleton";
import { UsageTable } from "./UsageTable";

interface UsageHistoryProps {
  /** 상세 보기를 열어 둔 사용 내역(쿼리 `id`). 그 행을 활성 처리함. */
  activeId: string | null;
  onClickDetail: (id: string) => void;
}

// 사용 상세 내역. PC·TAB은 표 + 인라인 툴바, MO는 카드 + 필터 모달. 쪽은 URL 쿼리가 소유하고 쪽 나눔은 서버가 함.
// 필터·검색은 서버 지원 전까지 모두 비활성이라 목록 요청에는 쪽만 보냄.
export function UsageHistory({ activeId, onClickDetail }: UsageHistoryProps) {
  const { t } = useTranslation("features/bigbird-money-history");
  const { t: tCommon } = useTranslation();
  const isTabletUp = useMediaQuery(TABLET_QUERY);
  const fields = useUsageFilterFields();
  const params = useListParams(fields);
  const { list, isLoading, isError, mutate } = useUsageHistory(params.page);

  const { clampPage } = params;
  const totalPages = list?.totalPages ?? 0;
  // 주소를 직접 고쳐 범위를 벗어난 쪽은 마지막 쪽으로 당김.
  const isPageOutOfRange =
    list !== undefined && totalPages > 0 && params.page > totalPages;
  useEffect(() => {
    if (isPageOutOfRange) clampPage(totalPages);
  }, [isPageOutOfRange, totalPages, clampPage]);

  const records = list?.records ?? [];
  const emptyContent =
    list?.totalCount === 0 ? (
      <ListEmptyState
        kind={resolveEmptyKind(params.keyword, hasActiveFilter(params.filters))}
        keyword={params.keyword}
        noneTitle={t("usage.empty.none")}
      />
    ) : undefined;

  return (
    <section className="flex flex-col gap-4" aria-labelledby="usage-title">
      <h2 id="usage-title" className="text-base font-semibold text-foreground">
        {t("usage.title")}
      </h2>
      <FilterToolbar
        fields={fields}
        values={params.filters}
        onChangeValues={params.setFilters}
        onApplyFromDialog={params.applyFiltersAndClosePanel}
        onRefresh={() => {
          params.reset();
          void mutate();
        }}
        // 검색은 세부 기획 정책이 정해진 뒤 개발(그 전에는 비활성, 스펙 §3).
        search={{
          keyword: params.keyword,
          onSubmit: params.setKeyword,
          isDisabled: true,
        }}
      />

      {isLoading ? (
        <UsageListSkeleton isTable={isTabletUp} />
      ) : isError || !list ? (
        <EmptyState
          type="alarm"
          title={tCommon("error.unexpected")}
          className="py-20"
          action={
            <Button variant="outline" onClick={() => void mutate()}>
              {tCommon("action.retry")}
            </Button>
          }
        />
      ) : (
        // 표(또는 카드)와 쪽 이동은 12px 간격으로 한 묶음(시안).
        <div className="flex flex-col gap-3">
          {isTabletUp ? (
            <UsageTable
              records={records}
              activeId={activeId}
              onClickDetail={(record) => onClickDetail(record.id)}
              emptyContent={emptyContent}
            />
          ) : (
            (emptyContent ?? <UsageCardList records={records} />)
          )}
          <ListPagination
            page={list.page}
            totalPages={totalPages}
            totalCount={list.totalCount}
            buildHref={params.buildPageHref}
            onChangePage={params.setPage}
          />
        </div>
      )}
    </section>
  );
}
