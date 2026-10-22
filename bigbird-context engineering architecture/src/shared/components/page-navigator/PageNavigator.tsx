import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/ui/pagination";

import { getPageItems } from "./get-page-items";

import type { MouseEvent } from "react";

interface PageNavigatorLabels {
  navigation: string;
  previous: string;
  next: string;
  /** 번호 링크의 접근성 이름(예: "3쪽"). */
  page: (page: number) => string;
}

interface PageNavigatorProps {
  page: number;
  totalPages: number;
  /** 각 쪽으로 가는 실제 주소. 새 탭으로 열거나 키보드로 이동할 수 있게 링크로 그림. */
  buildHref: (page: number) => string;
  onChangePage: (page: number) => void;
  labels: PageNavigatorLabels;
  className?: string;
}

// Figma Pagination(6901:49812): 이전 · 번호 · 줄임표 · 다음. 결과가 한 쪽뿐이어도 보이고, 없으면 그리지 않음.
export function PageNavigator({
  page,
  totalPages,
  buildHref,
  onChangePage,
  labels,
  className,
}: PageNavigatorProps) {
  if (totalPages < 1) return null;

  function handleClick(target: number) {
    return (event: MouseEvent) => {
      // 수정 키나 가운데 버튼은 브라우저 기본 동작(새 탭)을 따름.
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.button !== 0
      ) {
        return;
      }
      event.preventDefault();
      onChangePage(target);
    };
  }

  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <Pagination aria-label={labels.navigation} className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            aria-label={labels.previous}
            aria-disabled={!hasPrevious}
            href={hasPrevious ? buildHref(page - 1) : undefined}
            onClick={hasPrevious ? handleClick(page - 1) : undefined}
          >
            {labels.previous}
          </PaginationPrevious>
        </PaginationItem>
        {getPageItems(page, totalPages).map((item) =>
          item.type === "ellipsis" ? (
            <PaginationItem key={item.key}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item.page}>
              <PaginationLink
                aria-label={labels.page(item.page)}
                isActive={item.page === page}
                href={buildHref(item.page)}
                onClick={handleClick(item.page)}
              >
                {item.page}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            aria-label={labels.next}
            aria-disabled={!hasNext}
            href={hasNext ? buildHref(page + 1) : undefined}
            onClick={hasNext ? handleClick(page + 1) : undefined}
          >
            {labels.next}
          </PaginationNext>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
