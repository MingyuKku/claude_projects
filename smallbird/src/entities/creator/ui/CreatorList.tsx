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
  /** 고른 플랫폼. PC 표의 팔로워 칸 이름이 바뀜. */
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
  platformCode,
  sort,
  onClickSort,
}: CreatorListProps) {
  const { t } = useTranslation("entities/creator");
  const { t: tCommon } = useTranslation();
  const isTabletUp = useMediaQuery(MEDIA_QUERY.tabletUp);
  const isTable = isDesktop || isTabletUp;
  const columns = useCreatorColumns(
    isDesktop ? "desktop" : "tablet",
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

    return (
      <SkeletonGroup className="flex flex-col gap-3">
        {Array.from({ length: SKELETON_CARD_COUNT }, (_, card) => (
          <CreatorCardSkeleton key={card} />
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
        sort={sort}
        onClickSort={onClickSort}
      />
    );
  }

  if (isEmpty) return emptyContent;

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

// CreatorCardList 카드 한 장과 같은 치수
function CreatorCardSkeleton() {
  return (
    <Card>
      <div className="flex items-center p-4">
        <div className="flex h-12 items-center pr-4">
          <Skeleton className="size-4" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="size-9" />
        </div>
      </div>
      <div className="flex flex-col gap-2 px-3 pb-3">
        <div className="flex gap-2">
          <Skeleton className="h-16 flex-1" />
          <Skeleton className="h-16 flex-1" />
          <Skeleton className="h-16 flex-1" />
        </div>
        <Skeleton className="h-9.5 w-full" />
      </div>
    </Card>
  );
}
