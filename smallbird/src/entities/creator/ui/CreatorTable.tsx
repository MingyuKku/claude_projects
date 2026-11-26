import { ArrowDownUpIcon } from "lucide-react";

import { EmptyTableFrame } from "@/shared/components/list-filter";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { ScrollArea, ScrollBar } from "@/shared/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

import { isInteractiveTarget } from "../lib/is-interactive-target";
import { useCreatorTerms } from "../lib/use-creator-terms";
import { CreatorRowActions } from "./CreatorRowActions";

import type { SearchSort, SearchSortKey } from "../model/search-query";
import type { CreatorViewModel } from "../model/types";
import type { CreatorColumn } from "./use-creator-columns";
import type { ReactNode } from "react";

interface CreatorTableProps {
  items: CreatorViewModel[];
  /** 프로필과 버튼 사이 칸. */
  columns: CreatorColumn[];
  selectedKeys: ReadonlySet<string>;
  onChangeSelected: (key: string, isSelected: boolean) => void;
  onChangeAllSelected: (isSelected: boolean) => void;
  onClickBookmark: (creator: CreatorViewModel) => void;
  /** 없으면 제안 버튼은 비활성. */
  onClickPropose?: (creator: CreatorViewModel) => void;
  /** 체크박스·버튼 밖을 누르면 상세를 엶. */
  onClickItem: (creator: CreatorViewModel) => void;
  /** 있으면 행 대신 머리글 아래 본문 자리에 그림(0건·검색 결과 없음). */
  emptyContent?: ReactNode;
  /** 스크롤 영역 안, 표 아래(다음 쪽 표식·읽는 중·재시도). */
  footer?: ReactNode;
  /** 프로필 열 최소 폭을 줄임(표가 좁은 화면). */
  isProfileCompact?: boolean;
  /** 둘 다 있으면 머리글을 눌러 정렬함(크리에이터 검색). */
  sort?: SearchSort;
  onClickSort?: (key: SearchSortKey) => void;
  className?: string;
}

// 시안 폭은 최소 폭으로 둬, 문구가 긴 언어에서는 열이 넓어짐. 프로필 열이 남는 폭을 가짐.
const COLUMN_CLASS_NAMES = {
  checkbox: "w-12 min-w-12",
  profile: "w-full min-w-63",
  compactProfile: "w-full min-w-32",
  actions: "min-w-27",
};

// 시안 머리글 높이·배경. 체크박스가 있는 공통 머리글은 여백이 커서 덮음.
const TABLE_CLASS_NAME =
  "data-[header-tone=gray]:[--table-header-bg:color-mix(in_oklab,var(--color-muted)_64%,var(--color-background))] [&_th]:h-12 [&_th]:py-0";

// 자리를 차지하는 스크롤바는 열 합이 폭을 넘어 가로로 넘치게 하므로 겹치는 스크롤바를 쓰고, 머리글 높이만큼 내려 시작함.
const SCROLL_BAR_STYLE = { top: "3rem" };

// 표 바깥 스크롤 상자가 세로·가로 스크롤을 맡아 머리글을 위에 고정함(표 자체 컨테이너는 스크롤하지 않음).
export function CreatorTable({
  items,
  columns,
  selectedKeys,
  onChangeSelected,
  onChangeAllSelected,
  onClickBookmark,
  onClickPropose,
  onClickItem,
  emptyContent,
  footer,
  isProfileCompact = false,
  sort,
  onClickSort,
  className,
}: CreatorTableProps) {
  const { t } = useTranslation("entities/creator");
  const { term } = useCreatorTerms();

  const selectedCount = items.filter((item) =>
    selectedKeys.has(item.key),
  ).length;
  const isAllSelected = items.length > 0 && selectedCount === items.length;
  const checkedState = isAllSelected || (selectedCount > 0 && "indeterminate");

  const header = (
    <TableHeader className="sticky top-0 z-2">
      <TableRow>
        <TableHead className={COLUMN_CLASS_NAMES.checkbox}>
          <Checkbox
            className="block"
            aria-label={t("select.all")}
            checked={checkedState}
            disabled={items.length === 0}
            onCheckedChange={(state) => onChangeAllSelected(state === true)}
          />
        </TableHead>
        <SortableHead
          className={
            isProfileCompact
              ? COLUMN_CLASS_NAMES.compactProfile
              : COLUMN_CLASS_NAMES.profile
          }
          sortKey={onClickSort && "NICKNAME"}
          sort={sort}
          onClickSort={onClickSort}
        >
          {onClickSort ? t("column.creator") : term("profile")}
        </SortableHead>
        {columns.map((column) => (
          <SortableHead
            key={column.id}
            className={column.className}
            sortKey={column.sortKey}
            sort={sort}
            onClickSort={onClickSort}
          >
            {column.header}
          </SortableHead>
        ))}
        <TableHead className={COLUMN_CLASS_NAMES.actions}>
          <span className="sr-only">{t("column.actions")}</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );

  if (emptyContent) {
    return (
      <EmptyTableFrame className={className}>
        <Table
          headerTone="gray"
          size="xs"
          className={TABLE_CLASS_NAME}
          aria-label={t("list.label")}
          containerClassName="rounded-none border-0"
        >
          {header}
        </Table>
        {emptyContent}
      </EmptyTableFrame>
    );
  }

  return (
    <ScrollArea
      type="auto"
      className={cn("overflow-hidden rounded-lg border", className)}
      scrollBarStyle={SCROLL_BAR_STYLE}
    >
      <Table
        headerTone="gray"
        size="xs"
        className={TABLE_CLASS_NAME}
        aria-label={t("list.label")}
        containerClassName="overflow-visible rounded-none border-0"
      >
        {header}
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.key}
              data-state={selectedKeys.has(item.key) ? "selected" : undefined}
              className="cursor-pointer"
              onClick={(event) => {
                if (!isInteractiveTarget(event)) onClickItem(item);
              }}
            >
              <TableCell>
                <Checkbox
                  className="block"
                  aria-label={t("select.row", { name: item.nickname })}
                  checked={selectedKeys.has(item.key)}
                  onCheckedChange={(state) =>
                    onChangeSelected(item.key, state === true)
                  }
                />
              </TableCell>
              <TableCell className="max-w-0">
                <div className="flex items-center ds-gap-3">
                  <Avatar size="sm">
                    <AvatarImage
                      src={item.profileImageUrl ?? undefined}
                      alt=""
                    />
                    <AvatarPlaceholder />
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <button
                      type="button"
                      className="-mb-1 truncate pb-1 text-left ds-text-sm-none-medium text-foreground outline-none focus-visible:underline"
                      onClick={() => onClickItem(item)}
                    >
                      {item.nickname}
                    </button>
                    <p className="truncate ds-text-xs-4-normal text-muted-foreground">
                      @{item.platformId}
                    </p>
                  </div>
                </div>
              </TableCell>
              {columns.map((column) => (
                <TableCell key={column.id} className={column.cellClassName}>
                  {column.render(item)}
                </TableCell>
              ))}
              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  <CreatorRowActions
                    creator={item}
                    onClickBookmark={onClickBookmark}
                    onClickPropose={onClickPropose}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {footer}
      <ScrollBar orientation="horizontal" className="z-2" />
    </ScrollArea>
  );
}

interface SortableHeadProps {
  className?: string;
  sortKey?: SearchSortKey;
  sort?: SearchSort;
  onClickSort?: (key: SearchSortKey) => void;
  children: string;
}

// 정렬 칸 머리글은 공용 DataTable 정렬 머리글과 같은 모양(왼쪽 여백 없는 Ghost 버튼 + 화살표). 정렬 중인 칸만 글자를 강조함.
function SortableHead({
  className,
  sortKey,
  sort,
  onClickSort,
  children,
}: SortableHeadProps) {
  const { t } = useTranslation("entities/creator");

  if (!sortKey || !onClickSort) {
    return <TableHead className={className}>{children}</TableHead>;
  }

  const direction = sort?.startsWith(`${sortKey}_`)
    ? sort.slice(sortKey.length + 1)
    : null;
  const ariaSort = direction === "ASC" ? "ascending" : "descending";

  return (
    <TableHead
      // 표 공통 머리글 여백(py-0)보다 앞서도록 important로 둠.
      className={cn("py-1! pr-1! pl-0", className)}
      aria-sort={direction ? ariaSort : "none"}
    >
      <Button
        variant="ghost-muted"
        className={cn(
          "hover:bg-transparent hover:text-primary",
          direction && "text-primary",
        )}
        aria-label={t("column.sortBy", { name: children })}
        onClick={() => onClickSort(sortKey)}
      >
        {children}
        <ArrowDownUpIcon />
      </Button>
    </TableHead>
  );
}
