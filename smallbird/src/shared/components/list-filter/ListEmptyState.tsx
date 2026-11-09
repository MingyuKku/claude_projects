import { cva } from "class-variance-authority";

import { EmptyState } from "@/shared/components/empty-state";
import { useTranslation } from "@/shared/i18n";

import type { EmptyKind } from "./empty-kind";
import type { VariantProps } from "class-variance-authority";

// fill: 남은 높이를 채우되 위아래 40px은 비움. 부모가 flex-col이고 남은 높이를 가져야 채워지고, 상한은 부모가 화면마다 시안 값으로 둠
//   (빅버드 머니 `11755:116953`, Sub ID `10724:186107`).
// compact: 채우지 않고 안내 위아래 여백만 둠. 한 화면에 목록 섹션이 여러 개인 구독 결제 내역(PC 40·TAB 32·MO 28, `11755:97024`·`11755:97419`·`11755:99514`).
export const emptyHeightVariants = cva("", {
  variants: {
    height: {
      fill: "flex-1 py-10",
      compact: "py-7 tablet:py-8 desktop:py-10",
    },
  },
  defaultVariants: { height: "fill" },
});

interface ListEmptyStateProps {
  kind: EmptyKind;
  keyword: string;
  /** 0건일 때의 제목(탭마다 다름). */
  noneTitle: string;
  /** 본문 높이 방식. 생략하면 fill. */
  height?: VariantProps<typeof emptyHeightVariants>["height"];
}

// 표 머리글은 그대로 두고 본문 자리에 놓는 빈 상태. 0건은 no-list, 검색·필터 결과 없음은 no-search 일러스트.
export function ListEmptyState({
  kind,
  keyword,
  noneTitle,
  height,
}: ListEmptyStateProps) {
  const { t } = useTranslation();
  const className = emptyHeightVariants({ height });

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
