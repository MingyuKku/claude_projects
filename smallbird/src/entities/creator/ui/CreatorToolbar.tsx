import { RotateCw, Settings2 } from "lucide-react";

import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { useCreatorTerms } from "../lib/use-creator-terms";
import { CreatorKeywordSearch } from "./CreatorKeywordSearch";

import type { ReactNode } from "react";

interface CreatorToolbarProps {
  isTabletUp: boolean;
  isDesktop: boolean;
  keyword: string;
  onSubmitKeyword: (keyword: string) => void;
  onClickRefresh: () => void;
  /** PC·TAB에서 검색 옆에 놓는 선택 4개. 각각 `min-w-0 flex-1` 칸이어야 함. */
  filterSelects: ReactNode;
  /** 없으면 MO `기본 필터` 버튼은 비활성. */
  onClickBasicFilter?: () => void;
  /** 없으면 `상세 필터` 버튼은 비활성. */
  onClickDetailFilter?: () => void;
}

export function CreatorToolbar({
  isTabletUp,
  isDesktop,
  keyword,
  onSubmitKeyword,
  onClickRefresh,
  filterSelects,
  onClickBasicFilter,
  onClickDetailFilter,
}: CreatorToolbarProps) {
  const { t } = useTranslation("entities/creator");
  const { term } = useCreatorTerms();
  const { t: tCommon } = useTranslation();

  const search = (
    <CreatorKeywordSearch
      keyword={keyword}
      onSubmitKeyword={onSubmitKeyword}
      className={isDesktop ? "w-71.75 shrink-0" : "w-full"}
    />
  );

  if (!isTabletUp) {
    return (
      <div className="flex flex-col ds-gap-3">
        {search}
        <div className="flex gap-2">
          <Button
            variant="outline-foreground"
            className="flex-1"
            disabled={!onClickBasicFilter}
            onClick={onClickBasicFilter}
          >
            <Settings2 />
            {t("toolbar.basicFilter")}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            disabled={!onClickDetailFilter}
            onClick={onClickDetailFilter}
          >
            <Settings2 />
            {term("detailFilter")}
          </Button>
        </div>
      </div>
    );
  }

  const refreshButton = (
    <Button
      variant="ghost-foreground"
      size="icon"
      aria-label={tCommon("list.filter.refresh")}
      onClick={onClickRefresh}
    >
      <RotateCw />
    </Button>
  );
  const detailFilterButton = (
    <Button
      variant="outline"
      className="h-9.5 desktop:h-10"
      disabled={!onClickDetailFilter}
      onClick={onClickDetailFilter}
    >
      <Settings2 />
      {term("detailFilter")}
    </Button>
  );

  if (isDesktop) {
    return (
      <div className="flex items-center ds-gap-3">
        {search}
        {filterSelects}
        {refreshButton}
        {detailFilterButton}
      </div>
    );
  }

  return (
    <div className="flex flex-col ds-gap-3">
      {search}
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 gap-2">{filterSelects}</div>
        {refreshButton}
        {detailFilterButton}
      </div>
    </div>
  );
}
