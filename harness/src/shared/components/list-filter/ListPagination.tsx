import { PageNavigator } from "@/shared/components/page-navigator";
import { useTranslation } from "@/shared/i18n";

interface ListPaginationProps {
  page: number;
  totalPages: number;
  /** 결과가 0건이면 쪽 이동을 숨김(스펙). */
  totalCount: number;
  buildHref: (page: number) => string;
  onChangePage: (page: number) => void;
}

export function ListPagination({
  page,
  totalPages,
  totalCount,
  buildHref,
  onChangePage,
}: ListPaginationProps) {
  const { t: tCommon } = useTranslation();

  if (totalCount === 0) return null;
  return (
    <PageNavigator
      page={page}
      totalPages={totalPages}
      buildHref={buildHref}
      onChangePage={onChangePage}
      labels={{
        navigation: tCommon("pagination.navigation"),
        previous: tCommon("pagination.previous"),
        next: tCommon("pagination.next"),
        page: (target) => tCommon("pagination.page", { page: target }),
      }}
    />
  );
}
