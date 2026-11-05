import { useEffect } from "react";

import { usePaymentRecords } from "@/entities/subscription";
import { EmptyState } from "@/shared/components/empty-state";
import {
  FilterScreen,
  FilterToolbar,
  hasActiveFilter,
  ListEmptyState,
  ListPagination,
  resolveEmptyKind,
  useFilterScreen,
} from "@/shared/components/list-filter";
import { MEDIA_QUERY } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { countPages } from "../lib/count-pages";
import { useListParams } from "../lib/use-list-params";
import { usePaymentFilterFields } from "../lib/use-payment-filter-fields";
import { PAGE_SIZE_OPTIONS } from "../model/constants";
import { PaymentCardList } from "./PaymentCardList";
import { PaymentTable } from "./PaymentTable";

// 구독 결제 내역. PC는 표 + 인라인 툴바, TAB은 2열 카드, MO는 1열 카드 + 필터 모달. 한 페이지 10·20·50건(선택)·최신순.
// 쪽 나누기·필터는 서버가 하고, 쪽·필터는 URL 쿼리가 소유함. 검색창은 두지 않음(사용자 결정 2026-11-04, 스펙 §3).
export function PaymentHistory() {
  const { t } = useTranslation("features/payment-history");
  const { t: tCommon } = useTranslation();
  // 표는 PC(1440~)만 씀. TAB은 2열 카드, MO는 1열 카드.
  const isDesktop = useMediaQuery(MEDIA_QUERY.desktop);
  // TAB은 "필터" 버튼으로 본문을 대체하는 필터 화면을 엶(스펙 §3). PC는 인라인, MO는 모달.
  const filterScreen = useFilterScreen("desktop");
  const fields = usePaymentFilterFields();
  const params = useListParams(fields);
  const { dateFrom, dateTo, method, status } = params.filters;
  const {
    data: list,
    isLoading,
    isError,
    mutate,
  } = usePaymentRecords({
    page: params.page,
    size: params.pageSize,
    // 기간은 시작·종료가 모두 있어야 거름(필터 필드가 한 쌍으로 다룸).
    from: dateFrom && dateTo ? dateFrom : undefined,
    to: dateFrom && dateTo ? dateTo : undefined,
    method: method || undefined,
    status: status || undefined,
  });

  const totalCount = list?.totalCount ?? 0;
  const totalPages = countPages(totalCount, params.pageSize);
  const pageRecords = list?.records ?? [];

  const { clampPage } = params;
  // 주소를 직접 고쳐 범위를 벗어난 쪽은 마지막 쪽으로 당김.
  const isPageOutOfRange =
    list !== undefined && totalPages > 0 && params.page > totalPages;
  useEffect(() => {
    if (isPageOutOfRange) clampPage(totalPages);
  }, [isPageOutOfRange, totalPages, clampPage]);

  const emptyContent =
    list?.totalCount === 0 ? (
      <ListEmptyState
        kind={resolveEmptyKind("", hasActiveFilter(params.filters))}
        keyword=""
        noneTitle={t("empty.none")}
      />
    ) : undefined;

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
    // 제목과 툴바는 MO 8px·TAB/PC 16px, 툴바와 목록은 MO 16px·TAB/PC 12px(시안).
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
      <div className="flex flex-col gap-4 tablet:gap-3">
        <FilterToolbar
          fields={fields}
          values={params.filters}
          onChangeValues={params.setFilters}
          onApplyFromDialog={params.applyFiltersAndClosePanel}
          onRefresh={() => {
            params.reset();
            void mutate();
          }}
          inlineFrom="desktop"
          isNarrowSelect
          pageSize={{
            value: params.pageSize,
            options: PAGE_SIZE_OPTIONS,
            onChange: params.setPageSize,
          }}
        />
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
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
          /* 표(또는 카드)와 쪽 이동은 16px 간격(시안). */
          <div className="flex flex-col gap-4">
            {isDesktop ? (
              <PaymentTable records={pageRecords} emptyContent={emptyContent} />
            ) : (
              (emptyContent ?? <PaymentCardList records={pageRecords} />)
            )}
            <ListPagination
              page={params.page}
              totalPages={totalPages}
              totalCount={totalCount}
              buildHref={params.buildPageHref}
              onChangePage={params.setPage}
            />
          </div>
        )}
      </div>
    </section>
  );
}
