import { EmptyState } from "@/shared/components/empty-state";
import {
  SkeletonGroup,
  TableSkeleton,
} from "@/shared/components/skeleton-presets";
import { MEDIA_QUERY } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

import { CreatorCardList } from "./CreatorCardList";
import { CreatorCompactList } from "./CreatorCompactList";
import { CreatorTable } from "./CreatorTable";
import { LoadMoreFooter } from "./LoadMoreFooter";
import { useCreatorColumns } from "./use-creator-columns";

import type { SearchSort, SearchSortKey } from "../model/search-query";
import type {
  CreatorListView,
  CreatorViewModel,
  MatchingPlatformCode,
} from "../model/types";
import type { ReactNode } from "react";

interface CreatorListProps {
  list: CreatorListView;
  isDesktop: boolean;
  /** 읽기를 마쳤는데 0건일 때 그릴 안내. */
  emptyContent: ReactNode;
  selectedKeys: ReadonlySet<string>;
  onChangeSelected: (key: string, isSelected: boolean) => void;
  onChangeAllSelected: (isSelected: boolean) => void;
  onClickBookmark: (creator: CreatorViewModel) => void;
  /** 없으면 제안 버튼은 비활성. */
  onClickPropose?: (creator: CreatorViewModel) => void;
  /** 행·카드를 누르면 상세를 엶. */
  onClickItem: (creator: CreatorViewModel) => void;
  isProfileCompact?: boolean;
  /** `search`는 검색 화면 칸 구성(PC 표, TAB 한 줄 표, MO 두 줄 카드). */
  layout?: "default" | "search";
  /** 고른 플랫폼. 검색 PC 표의 칸이 바뀜. */
  platformCode?: MatchingPlatformCode;
  /** 둘 다 있으면 표 머리글로 정렬함. */
  sort?: SearchSort;
  onClickSort?: (key: SearchSortKey) => void;
}

const SKELETON_ROW_COUNT = 8;
const SKELETON_CARD_COUNT = 4;
const SKELETON_BAR_CLASS_NAMES: Record<string, string> = {
  platform: "w-6",
  category: "w-24",
};

// 목록 본문: 읽는 중·실패·빈 상태·표/카드. 끝까지 스크롤하면 다음 쪽을 이어 붙임.
export function CreatorList({
  list,
  isDesktop,
  emptyContent,
  selectedKeys,
  onChangeSelected,
  onChangeAllSelected,
  onClickBookmark,
  onClickPropose,
  onClickItem,
  isProfileCompact,
  layout = "default",
  platformCode,
  sort,
  onClickSort,
}: CreatorListProps) {
  const { t } = useTranslation("entities/creator");
  const { t: tCommon } = useTranslation();
  const isTabletUp = useMediaQuery(MEDIA_QUERY.tabletUp);
  const isSearch = layout === "search";
  const isTable = isDesktop || (isSearch && isTabletUp);
  const columns = useCreatorColumns(
    isSearch && !isDesktop ? "searchTablet" : layout,
    platformCode,
  );

  if (list.isLoading) {
    if (isTable) {
      // 체크박스·프로필·칸·버튼 순으로 실제 표와 칸 수를 맞춤
      const columnClassNames = [
        "w-6",
        "w-40",
        ...columns.map(
          (column) => SKELETON_BAR_CLASS_NAMES[column.id] ?? "w-10",
        ),
        "w-16",
      ];

      return (
        <div className="min-h-0 flex-1 overflow-hidden">
          <SkeletonGroup>
            <TableSkeleton
              columnClassNames={columnClassNames}
              rowCount={SKELETON_ROW_COUNT}
              size="xs"
            />
          </SkeletonGroup>
        </div>
      );
    }

    if (isSearch) {
      return (
        <SkeletonGroup className="flex flex-col gap-3">
          {Array.from({ length: SKELETON_CARD_COUNT }, (_, card) => (
            <CreatorCompactSkeleton key={card} />
          ))}
        </SkeletonGroup>
      );
    }

    return (
      <SkeletonGroup className="grid grid-cols-1 gap-3 tablet:grid-cols-2 tablet:gap-4">
        {Array.from({ length: SKELETON_CARD_COUNT }, (_, card) => (
          <Skeleton key={card} className="h-60 w-full" />
        ))}
      </SkeletonGroup>
    );
  }

  if (list.isError) {
    return (
      <EmptyState
        type="alarm"
        title={t("list.error")}
        className="flex-1 py-10"
        action={
          <Button variant="outline" onClick={() => void list.reload()}>
            {tCommon("action.retry")}
          </Button>
        }
      />
    );
  }

  const isEmpty = list.items.length === 0;

  const footer = <LoadMoreFooter list={list} />;

  if (isTable) {
    return (
      <CreatorTable
        className="min-h-0 flex-1"
        items={list.items}
        columns={columns}
        selectedKeys={selectedKeys}
        onChangeSelected={onChangeSelected}
        onChangeAllSelected={onChangeAllSelected}
        onClickBookmark={onClickBookmark}
        onClickPropose={onClickPropose}
        onClickItem={onClickItem}
        emptyContent={isEmpty ? emptyContent : undefined}
        footer={footer}
        isProfileCompact={isProfileCompact}
        sort={sort}
        onClickSort={onClickSort}
      />
    );
  }

  if (isEmpty) return emptyContent;

  if (isSearch) {
    return (
      <CreatorCompactList
        items={list.items}
        selectedKeys={selectedKeys}
        onChangeSelected={onChangeSelected}
        onClickBookmark={onClickBookmark}
        onClickPropose={onClickPropose}
        onClickItem={onClickItem}
        footer={footer}
      />
    );
  }

  return (
    <CreatorCardList
      items={list.items}
      selectedKeys={selectedKeys}
      onChangeSelected={onChangeSelected}
      onClickBookmark={onClickBookmark}
      onClickPropose={onClickPropose}
      onClickItem={onClickItem}
      footer={footer}
    />
  );
}

// CreatorCompactList 카드 한 장과 같은 치수
function CreatorCompactSkeleton() {
  return (
    <Card>
      <div className="flex items-center pt-4 pr-4">
        <div className="flex h-12 items-center px-4">
          <Skeleton className="size-4" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="size-9" />
          <Skeleton className="size-9" />
        </div>
      </div>
      <div className="flex h-12 items-center gap-4 px-4 pb-4">
        <Skeleton className="size-6" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
    </Card>
  );
}
