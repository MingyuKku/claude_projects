import { EmptyState } from "@/shared/components/empty-state";
import {
  SkeletonGroup,
  TableSkeleton,
} from "@/shared/components/skeleton-presets";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { CreatorCardList } from "./CreatorCardList";
import { CreatorTable } from "./CreatorTable";
import { LoadMoreFooter } from "./LoadMoreFooter";

import type { CreatorListView, CreatorViewModel } from "../model/types";
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
}

const SKELETON_ROW_COUNT = 8;
const SKELETON_CARD_COUNT = 4;
const TABLE_SKELETON_COLUMNS = [
  "w-6",
  "w-40",
  "w-6",
  "w-24",
  "w-10",
  "w-10",
  "w-10",
  "w-12",
  "w-16",
  "w-16",
];

// 목록 본문: 읽는 중·실패·빈 상태·표(PC)/카드(TAB·MO). 끝까지 스크롤하면 다음 쪽을 이어 붙임.
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
}: CreatorListProps) {
  const { t } = useTranslation("entities/creator");
  const { t: tCommon } = useTranslation();

  if (list.isLoading) {
    return isDesktop ? (
      <div className="min-h-0 flex-1 overflow-hidden">
        <SkeletonGroup>
          <TableSkeleton
            columnClassNames={TABLE_SKELETON_COLUMNS}
            rowCount={SKELETON_ROW_COUNT}
          />
        </SkeletonGroup>
      </div>
    ) : (
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

  if (isDesktop) {
    return (
      <CreatorTable
        className="min-h-0 flex-1"
        items={list.items}
        selectedKeys={selectedKeys}
        onChangeSelected={onChangeSelected}
        onChangeAllSelected={onChangeAllSelected}
        onClickBookmark={onClickBookmark}
        onClickPropose={onClickPropose}
        onClickItem={onClickItem}
        emptyContent={isEmpty ? emptyContent : undefined}
        footer={footer}
        isProfileCompact={isProfileCompact}
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
