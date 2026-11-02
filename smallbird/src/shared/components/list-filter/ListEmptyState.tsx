import { EmptyState } from "@/shared/components/empty-state";
import { useTranslation } from "@/shared/i18n";

import type { EmptyKind } from "./empty-kind";

interface ListEmptyStateProps {
  kind: EmptyKind;
  keyword: string;
  /** 0건일 때의 제목(탭마다 다름). */
  noneTitle: string;
}

// 표 머리글은 그대로 두고 본문 자리에 놓는 빈 상태. 0건은 no-list, 검색·필터 결과 없음은 no-search 일러스트.
// 시안의 빈 표는 화면 높이를 채움.
export function ListEmptyState({
  kind,
  keyword,
  noneTitle,
}: ListEmptyStateProps) {
  const { t } = useTranslation();
  const className = "min-h-86.5 tablet:min-h-112 desktop:min-h-133";

  if (kind === "none") {
    return (
      <EmptyState type="no-list" title={noneTitle} className={className} />
    );
  }
  if (kind === "search") {
    return (
      <EmptyState
        type="no-search"
        title={t("list.empty.search.title", { keyword })}
        className={className}
      />
    );
  }
  return (
    <EmptyState
      type="no-search"
      title={
        kind === "searchFilter"
          ? t("list.empty.searchFilter.title", { keyword })
          : t("list.empty.filter.title")
      }
      description={t("list.empty.filter.description")}
      className={className}
    />
  );
}
