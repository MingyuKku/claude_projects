import { useEffect } from "react";

import {
  usePaymentRecords,
  usePaymentScrollList,
} from "@/entities/subscription";
import { EmptyState } from "@/shared/components/empty-state";
import {
  FilterToolbar,
  hasActiveFilter,
  ListEmptyState,
  ListPagination,
  resolveEmptyKind,
} from "@/shared/components/list-filter";
import { MEDIA_QUERY } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { countPages } from "../lib/count-pages";
import { toPaymentItemQuery } from "../lib/payment-item";
import { useListParams } from "../lib/use-list-params";
import { usePaymentFilterFields } from "../lib/use-payment-filter-fields";
import { PAGE_SIZE_OPTIONS } from "../model/constants";
import { PaymentCardList } from "./PaymentCardList";
import { PaymentListSkeleton } from "./PaymentListSkeleton";
import { PaymentScrollList } from "./PaymentScrollList";
import { PaymentTable } from "./PaymentTable";

// 쪽 나누기·필터는 서버가 하고, 쪽·필터는 URL 쿼리가 소유함. 검색창은 두지 않음.
// PC·TAB은 쪽 이동, MO는 스크롤로 이어 읽고 주소의 쪽은 쓰지 않음. 폭에 따라 한쪽만 읽음.
export function PaymentHistory() {
  const { t } = useTranslation("features/payment-history");
  const { t: tCommon } = useTranslation();
  const isTabletUp = useMediaQuery(MEDIA_QUERY.tabletUp);
  const isDesktop = useMediaQuery(MEDIA_QUERY.desktop);
  const fields = usePaymentFilterFields();
  const params = useListParams(fields);
  const { dateFrom, dateTo, item, method, status } = params.filters;
  const baseQuery = {
    size: params.pageSize,
    // 기간은 시작·종료가 모두 있어야 거름(필터 필드가 한 쌍으로 다룸).
    from: dateFrom && dateTo ? dateFrom : undefined,
    to: dateFrom && dateTo ? dateTo : undefined,
    ...toPaymentItemQuery(item),
    method: method || undefined,
    status: status || undefined,
  };
  const paged = usePaymentRecords(
    isTabletUp ? { ...baseQuery, page: params.page } : null,
  );
  const scroll = usePaymentScrollList(baseQuery, !isTabletUp);

  const list = paged.data;
  const totalCount = list?.totalCount ?? 0;
  const totalPages = countPages(totalCount, params.pageSize);

  const { clampPage } = params;
  // 주소를 직접 고쳐 범위를 벗어난 쪽은 마지막 쪽으로 당김.
  const isPageOutOfRange =
    isTabletUp &&
    list !== undefined &&
    totalPages > 0 &&
    params.page > totalPages;
  useEffect(() => {
    if (isPageOutOfRange) clampPage(totalPages);
  }, [isPageOutOfRange, totalPages, clampPage]);

  const isLoading = isTabletUp ? paged.isLoading : scroll.isLoading;
  const isError = isTabletUp ? paged.isError || !list : scroll.isError;
  const isEmpty = isTabletUp
    ? list?.totalCount === 0
    : scroll.hasData && scroll.totalCount === 0;
  const reload = () => void (isTabletUp ? paged.mutate() : scroll.reload());
  const emptyContent = isEmpty ? (
    <ListEmptyState
      kind={resolveEmptyKind("", hasActiveFilter(params.filters))}
      keyword=""
      noneTitle={t("empty.none")}
      height="compact"
    />
  ) : undefined;

  function renderList() {
    if (isLoading) {
      return (
        <PaymentListSkeleton isTable={isDesktop} rowCount={params.pageSize} />
      );
    }
    if (isError) {
      return (
        <EmptyState
          type="alarm"
          title={tCommon("error.unexpected")}
          className="py-20"
          action={
            <Button variant="outline" onClick={reload}>
              {tCommon("action.retry")}
            </Button>
          }
        />
      );
    }
    if (!isTabletUp) {
      return (
        emptyContent ?? (
          <PaymentScrollList
            records={scroll.records}
            hasMore={scroll.hasMore}
            isLoadingMore={scroll.isLoadingMore}
            isLoadMoreError={scroll.isLoadMoreError}
            onLoadMore={scroll.loadMore}
            onRetry={reload}
          />
        )
      );
    }
    const records = list?.records ?? [];
    return (
      <div className="flex flex-col gap-4">
        {isDesktop ? (
          <PaymentTable records={records} emptyContent={emptyContent} />
        ) : (
          (emptyContent ?? <PaymentCardList records={records} />)
        )}
        <ListPagination
          page={params.page}
          totalPages={totalPages}
          totalCount={totalCount}
          buildHref={params.buildPageHref}
          onChangePage={params.setPage}
        />
      </div>
    );
  }

  return (
    <section
      className="flex flex-col gap-2 tablet:gap-4"
      aria-labelledby="payments-title"
    >
      <h2
        id="payments-title"
        className="text-base leading-none font-semibold text-foreground"
      >
        {t("title")}
      </h2>
      <div
        className={cn(
          "flex flex-col tablet:gap-3",
          isEmpty ? "gap-2" : "gap-4",
        )}
      >
        <FilterToolbar
          fields={fields}
          values={params.filters}
          onChangeValues={params.setFilters}
          onApplyFromDialog={params.applyFiltersAndClosePanel}
          onRefresh={() => {
            params.reset();
            reload();
          }}
          pageSize={{
            value: params.pageSize,
            options: PAGE_SIZE_OPTIONS,
            onChange: params.setPageSize,
          }}
        />
        {renderList()}
      </div>
    </section>
  );
}
