import {
  FilterScreen,
  FilterToolbar,
  hasActiveFilter,
  ListEmptyState,
  resolveEmptyKind,
  useFilterScreen,
} from "@/shared/components/list-filter";
import { MEDIA_QUERY } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib";

import { useUsageHistory, useUsageScrollList } from "../api/use-usage-history";
import { useUsageListParams } from "../lib/use-usage-list-params";
import {
  EMPTY_LIST_MAX_HEIGHT_CLASS,
  LIST_PAGE_SIZE_OPTIONS,
  USAGE_KEYWORD_MAX_LENGTH,
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
// 필터(구분·사용 일자·캠페인 명·사용 내역)와 "N개 보기"(10·20·30)는 주소 쿼리가 소유하고 서버에 함께 보냄. 검색어(`keyword`)는 캠페인 명·코드·사용 내역 문구를 부분 일치로 찾음(Q-8).
export function UsageHistory({
  activeId,
  isPanelOpen,
  onClickDetail,
}: UsageHistoryProps) {
  const { t } = useTranslation("features/bigbird-money-history");
  const isTabletUp = useMediaQuery(MEDIA_QUERY.tabletUp);
  const isDesktop = useMediaQuery(MEDIA_QUERY.desktop);
  const { fields, params, baseQuery, isOptionsPending } = useUsageListParams();
  const filterScreen = useFilterScreen("desktop");
  // 쪽 나눔 목록(PC·TAB)과 이어 읽는 목록(MO)은 폭에 따라 한쪽만 읽음.
  // 주소의 캠페인·사용 내역 필터가 선택지를 기다리는 동안은 읽지 않고 로딩으로 보임(필터 없는 목록이 먼저 비치지 않게).
  const paged = useUsageHistory(
    isTabletUp && !isOptionsPending
      ? { ...baseQuery, page: params.page }
      : null,
  );
  const scroll = useUsageScrollList(
    baseQuery,
    !isTabletUp && !isOptionsPending,
  );

  const emptyContent = (
    <ListEmptyState
      kind={resolveEmptyKind(params.keyword, hasActiveFilter(params.filters))}
      keyword={params.keyword}
      noneTitle={t("usage.empty.none")}
      height="fill"
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
    <section
      className="flex flex-1 flex-col gap-4"
      aria-labelledby="usage-title"
    >
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
        // 검색 대상은 캠페인 명·캠페인 코드·사용 내역 문구(부분 일치, 서버 `keyword`, API 명세 Q-8).
        search={{
          keyword: params.keyword,
          onSubmit: params.setKeyword,
          maxLength: USAGE_KEYWORD_MAX_LENGTH,
        }}
      />

      {isTabletUp ? (
        <HistoryPagedList
          list={paged.list}
          isLoading={paged.isLoading || isOptionsPending}
          isError={paged.isError}
          onRetry={() => void paged.mutate()}
          page={params.page}
          onChangePage={params.setPage}
          onClampPage={params.clampPage}
          buildPageHref={params.buildPageHref}
          skeleton={skeleton}
          emptyContent={emptyContent}
          emptyClassName={EMPTY_LIST_MAX_HEIGHT_CLASS}
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
          isLoading={scroll.isLoading || isOptionsPending}
          isLoadingMore={scroll.isLoadingMore}
          isError={scroll.isError}
          isLoadMoreError={scroll.isLoadMoreError}
          onLoadMore={scroll.loadMore}
          onRetry={() => void scroll.reload()}
          skeleton={skeleton}
          emptyContent={emptyContent}
          emptyClassName={EMPTY_LIST_MAX_HEIGHT_CLASS}
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
