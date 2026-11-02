import {
  FilterScreen,
  FilterToolbar,
  hasActiveFilter,
  ListEmptyState,
  resolveEmptyKind,
  useFilterScreen,
} from "@/shared/components/list-filter";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib";

import { useUsageHistory, useUsageScrollList } from "../api/use-usage-history";
import { useUsageListParams } from "../lib/use-usage-list-params";
import {
  DESKTOP_QUERY,
  LIST_PAGE_SIZE_OPTIONS,
  TABLET_QUERY,
} from "../model/constants";
import { HistoryPagedList } from "./HistoryPagedList";
import { HistoryScrollList } from "./HistoryScrollList";
import { UsageCardList } from "./UsageCardList";
import { UsageListSkeleton } from "./UsageListSkeleton";
import { UsageTable } from "./UsageTable";

interface UsageHistoryProps {
  /** 상세 보기를 열어 둔 사용 내역(쿼리 `id`). 그 행을 활성 처리함. */
  activeId: string | null;
  /** 옆 패널(사용 상세·충전·출금)이 열려 있음. 열려 있으면 캠페인 명·잔액 열을 숨김. */
  isPanelOpen: boolean;
  onClickDetail: (id: string) => void;
}

// 사용 내역. PC는 표 + 인라인 툴바, TAB은 2열 카드 + "필터" 화면(`?panel=filter`), MO는 1열 카드 + 스크롤로 이어 읽기(맨 위로 버튼) + 필터 모달.
// 필터(구분·사용 일자·캠페인 명·사용 내역)와 "N개 보기"(10·20·50)는 주소 쿼리가 소유하고 서버에 함께 보냄. 검색은 대상이 정해지기 전(Q-8)이라 비활성.
export function UsageHistory({
  activeId,
  isPanelOpen,
  onClickDetail,
}: UsageHistoryProps) {
  const { t } = useTranslation("features/bigbird-money-history");
  const isTabletUp = useMediaQuery(TABLET_QUERY);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const { fields, params, baseQuery } = useUsageListParams();
  const filterScreen = useFilterScreen("desktop");
  // 쪽 나눔 목록(PC·TAB)과 이어 읽는 목록(MO)은 폭에 따라 한쪽만 읽음.
  const paged = useUsageHistory(
    isTabletUp ? { ...baseQuery, page: params.page } : null,
  );
  const scroll = useUsageScrollList(baseQuery, !isTabletUp);

  const emptyContent = (
    <ListEmptyState
      kind={resolveEmptyKind(params.keyword, hasActiveFilter(params.filters))}
      keyword={params.keyword}
      noneTitle={t("usage.empty.none")}
    />
  );
  const skeleton = <UsageListSkeleton isTable={isDesktop} />;
  const refresh = () => {
    params.reset();
    void (isTabletUp ? paged.mutate() : scroll.reload());
  };

  if (filterScreen.isOpen) {
    return (
      <FilterScreen
        onClose={filterScreen.close}
        fields={fields}
        values={params.filters}
        onApply={params.applyFiltersAndClosePanel}
      />
    );
  }

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
        onRefresh={refresh}
        // TAB은 "필터" 버튼 → 본문을 대체하는 "필터 검색 설정" 화면(구독 결제 내역과 같음).
        inlineFrom="desktop"
        isCompact
        pageSize={{
          value: params.pageSize,
          options: LIST_PAGE_SIZE_OPTIONS,
          onChange: params.setPageSize,
        }}
        // 검색은 검색 대상이 정해진 뒤 개발(그 전에는 비활성, 스펙 §3, API 명세 Q-8).
        search={{
          keyword: params.keyword,
          onSubmit: params.setKeyword,
          isDisabled: true,
        }}
      />

      {isTabletUp ? (
        <HistoryPagedList
          list={paged.list}
          isLoading={paged.isLoading}
          isError={paged.isError}
          onRetry={() => void paged.mutate()}
          page={params.page}
          onChangePage={params.setPage}
          onClampPage={params.clampPage}
          buildPageHref={params.buildPageHref}
          skeleton={skeleton}
          emptyContent={emptyContent}
          isTable={isDesktop}
          renderTable={(records, empty) => (
            <UsageTable
              records={records}
              activeId={activeId}
              isPanelOpen={isPanelOpen}
              onClickDetail={(record) => onClickDetail(record.id)}
              emptyContent={empty}
            />
          )}
          renderCards={(records) => (
            <UsageCardList
              records={records}
              onClickDetail={(record) => onClickDetail(record.id)}
            />
          )}
        />
      ) : (
        <HistoryScrollList
          records={scroll.records}
          totalCount={scroll.totalCount}
          hasMore={scroll.hasMore}
          isLoading={scroll.isLoading}
          isLoadingMore={scroll.isLoadingMore}
          isError={scroll.isError}
          isLoadMoreError={scroll.isLoadMoreError}
          onLoadMore={scroll.loadMore}
          onRetry={() => void scroll.reload()}
          skeleton={skeleton}
          emptyContent={emptyContent}
          renderCards={(records) => (
            <UsageCardList
              records={records}
              onClickDetail={(record) => onClickDetail(record.id)}
            />
          )}
        />
      )}
    </section>
  );
}
