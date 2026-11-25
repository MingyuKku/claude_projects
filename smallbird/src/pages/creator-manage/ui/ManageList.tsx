import { Plus, Search } from "lucide-react";
import { Link } from "react-router";

import { CreatorList } from "@/entities/creator";
import { EmptyState } from "@/shared/components/empty-state";
import { ListEmptyState } from "@/shared/components/list-filter";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import type { CreatorListView, CreatorViewModel } from "@/entities/creator";

interface ManageListProps {
  list: CreatorListView;
  isTabletUp: boolean;
  isDesktop: boolean;
  keyword: string;
  /** null이면 `전체`. */
  folderIdx: number | null;
  /** 상세 필터가 걸려 있음. */
  hasFilter: boolean;
  selectedKeys: ReadonlySet<string>;
  onChangeSelected: (key: string, isSelected: boolean) => void;
  onChangeAllSelected: (isSelected: boolean) => void;
  onClickBookmark: (creator: CreatorViewModel) => void;
  onClickPropose?: (creator: CreatorViewModel) => void;
  onClickItem: (creator: CreatorViewModel) => void;
}

export function ManageList({
  list,
  isTabletUp,
  isDesktop,
  keyword,
  folderIdx,
  hasFilter,
  selectedKeys,
  onChangeSelected,
  onChangeAllSelected,
  onClickBookmark,
  onClickPropose,
  onClickItem,
}: ManageListProps) {
  return (
    <CreatorList
      list={list}
      isDesktop={isDesktop}
      emptyContent={
        <ManageEmpty
          isTabletUp={isTabletUp}
          keyword={keyword}
          isAllFolder={folderIdx === null}
          hasFilter={hasFilter}
        />
      }
      selectedKeys={selectedKeys}
      onChangeSelected={onChangeSelected}
      onChangeAllSelected={onChangeAllSelected}
      onClickBookmark={onClickBookmark}
      onClickPropose={onClickPropose}
      onClickItem={onClickItem}
    />
  );
}

interface ManageEmptyProps {
  isTabletUp: boolean;
  keyword: string;
  isAllFolder: boolean;
  hasFilter: boolean;
}

// 검색어·상세 필터가 있으면 결과 없음, 없으면 폴더 상태에 따른 안내(전체가 비었는지, 그 폴더만 비었는지).
function ManageEmpty({
  isTabletUp,
  keyword,
  isAllFolder,
  hasFilter,
}: ManageEmptyProps) {
  const { t } = useTranslation("pages/creator-manage");

  if (hasFilter) {
    return (
      <ListEmptyState
        kind={keyword ? "searchFilter" : "filter"}
        keyword={keyword}
        noneTitle=""
      />
    );
  }
  if (keyword) {
    return <ListEmptyState kind="search" keyword={keyword} noneTitle="" />;
  }

  const scope = isAllFolder ? "all" : "folder";
  return (
    <EmptyState
      type="folder"
      title={t(`empty.${scope}.title`)}
      // MO 시안에는 설명이 없음.
      description={isTabletUp ? t(`empty.${scope}.description`) : undefined}
      className="flex-1 gap-4 py-10 tablet:gap-5 desktop:gap-6"
      action={
        <Button variant="outline" className="h-9.5 desktop:h-10" asChild>
          <Link to={ROUTES.creatorSearch}>
            {isAllFolder ? <Search /> : <Plus />}
            {t(`empty.${scope}.action`)}
          </Link>
        </Button>
      }
    />
  );
}
