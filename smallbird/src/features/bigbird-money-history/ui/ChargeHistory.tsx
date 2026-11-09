import {
  FilterToolbar,
  hasActiveFilter,
  ListEmptyState,
  resolveEmptyKind,
} from "@/shared/components/list-filter";
import { MEDIA_QUERY } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib";

import {
  useChargeHistory,
  useChargeScrollList,
  useReloadChargeHistory,
} from "../api/use-charge-history";
import { useChargeAutoRefresh } from "../lib/use-charge-auto-refresh";
import { useChargeListParams } from "../lib/use-charge-list-params";
import {
  EMPTY_LIST_MAX_HEIGHT_CLASS,
  LIST_PAGE_SIZE_OPTIONS,
} from "../model/constants";
import { ChargeCardList } from "./ChargeCardList";
import { ChargeListSkeleton } from "./ChargeListSkeleton";
import { ChargeTable } from "./ChargeTable";
import { HistoryPagedList } from "./HistoryPagedList";
import { HistoryScrollList } from "./HistoryScrollList";

interface ChargeHistoryProps {
  /** 거래 상세를 열어 둔 충전 내역(쿼리 `id`). 그 행을 활성 처리함. */
  activeId: string | null;
  /** 오른쪽 패널(충전·출금·거래 상세)이 열려 있음. 열려 있으면 은행·계좌 번호 열을 숨김. */
  isPanelOpen: boolean;
  onClickDetail: (id: string) => void;
}

// 충전/출금 내역. PC는 표, TAB은 2열 카드 + 쪽 이동, MO는 1열 카드 + 스크롤로 이어 읽기(맨 위로 버튼). 툴바는 PC·TAB 인라인, MO "필터" 모달. 검색창은 없음(스펙 §3).
// 필터(구분·충전 일자·입금 상태)와 "N개 보기"(10·20·30)는 주소 쿼리가 소유하고 서버에 함께 보냄.
export function ChargeHistory({
  activeId,
  isPanelOpen,
  onClickDetail,
}: ChargeHistoryProps) {
  const { t } = useTranslation("features/bigbird-money-history");
  const isTabletUp = useMediaQuery(MEDIA_QUERY.tabletUp);
  const isDesktop = useMediaQuery(MEDIA_QUERY.desktop);
  const { fields, params, baseQuery } = useChargeListParams();
  const reload = useReloadChargeHistory();
  // 쪽 나눔 목록(PC·TAB)과 이어 읽는 목록(MO)은 폭에 따라 한쪽만 읽음.
  const paged = useChargeHistory(
    isTabletUp ? { ...baseQuery, page: params.page } : null,
  );
  const scroll = useChargeScrollList(baseQuery, !isTabletUp);
  useChargeAutoRefresh(
    isTabletUp ? (paged.list?.records ?? []) : scroll.records,
  );

  const emptyContent = (
    <ListEmptyState
      kind={resolveEmptyKind("", hasActiveFilter(params.filters))}
      keyword=""
      noneTitle={t("charge.empty.none")}
      height="fill"
    />
  );
  const skeleton = <ChargeListSkeleton isTable={isDesktop} />;

  return (
    <section
      className="flex flex-1 flex-col gap-4"
      aria-labelledby="charge-title"
    >
      <h2 id="charge-title" className="text-base font-semibold text-foreground">
        {t("charge.title")}
      </h2>
      <FilterToolbar
        fields={fields}
        values={params.filters}
        onChangeValues={params.setFilters}
        onApplyFromDialog={params.applyFiltersAndClosePanel}
        onRefresh={() => {
          params.reset();
          void reload();
        }}
        shouldFillFields={isPanelOpen}
        pageSize={{
          value: params.pageSize,
          options: LIST_PAGE_SIZE_OPTIONS,
          onChange: params.setPageSize,
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
          emptyClassName={EMPTY_LIST_MAX_HEIGHT_CLASS}
          isTable={isDesktop}
          renderTable={(records, empty) => (
            <ChargeTable
              records={records}
              activeId={activeId}
              isPanelOpen={isPanelOpen}
              onClickDetail={(record) => onClickDetail(record.id)}
              emptyContent={empty}
            />
          )}
          renderCards={(records) => (
            <ChargeCardList
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
          emptyClassName={EMPTY_LIST_MAX_HEIGHT_CLASS}
          renderCards={(records) => (
            <ChargeCardList
              records={records}
              onClickDetail={(record) => onClickDetail(record.id)}
            />
          )}
        />
      )}
    </section>
  );
}
