import { EmptyTableFrame } from "@/shared/components/list-filter";
import { useTranslation } from "@/shared/i18n";
import { EMPTY_VALUE } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";
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

import { useCreatorLabels } from "../api/use-creator-labels";
import { isInteractiveTarget } from "../lib/is-interactive-target";
import { useCreatorMetricTexts } from "../lib/use-creator-metric-texts";
import { useCreatorTerms } from "../lib/use-creator-terms";
import { CreatorPlatform } from "./CreatorPlatform";
import { CreatorRowActions } from "./CreatorRowActions";

import type { CreatorViewModel } from "../model/types";
import type { ReactNode } from "react";

interface CreatorTableProps {
  items: CreatorViewModel[];
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
  className?: string;
}

// 시안 폭은 최소 폭으로 둬, 문구가 긴 언어에서는 열이 넓어짐. 프로필 열이 남는 폭을 가짐.
const COLUMN_CLASS_NAMES = {
  checkbox: "w-12 min-w-12",
  profile: "w-full min-w-63",
  compactProfile: "w-full min-w-32",
  platform: "min-w-17.25",
  category: "min-w-35.75",
  metric: "min-w-24",
  commentWriters: "min-w-35",
  expectedCost: "min-w-30",
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
  selectedKeys,
  onChangeSelected,
  onChangeAllSelected,
  onClickBookmark,
  onClickPropose,
  onClickItem,
  emptyContent,
  footer,
  isProfileCompact = false,
  className,
}: CreatorTableProps) {
  const { t } = useTranslation("entities/creator");
  const { term } = useCreatorTerms();
  const { findPlatform, findCategoryName } = useCreatorLabels();
  const getMetricTexts = useCreatorMetricTexts();

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
        <TableHead
          className={
            isProfileCompact
              ? COLUMN_CLASS_NAMES.compactProfile
              : COLUMN_CLASS_NAMES.profile
          }
        >
          {term("profile")}
        </TableHead>
        <TableHead className={COLUMN_CLASS_NAMES.platform}>
          {term("platform")}
        </TableHead>
        <TableHead className={COLUMN_CLASS_NAMES.category}>
          {term("category")}
        </TableHead>
        <TableHead className={COLUMN_CLASS_NAMES.metric}>
          {term("followerCount")}
        </TableHead>
        <TableHead className={COLUMN_CLASS_NAMES.metric}>
          {t("column.brandIndex")}
        </TableHead>
        <TableHead className={COLUMN_CLASS_NAMES.metric}>
          {t("column.groupBuyIndex")}
        </TableHead>
        <TableHead className={COLUMN_CLASS_NAMES.commentWriters}>
          {term("avgCommentWriterCount")}
        </TableHead>
        <TableHead className={COLUMN_CLASS_NAMES.expectedCost}>
          {term("expectedCost")}
        </TableHead>
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
          {items.map((item) => {
            const metrics = getMetricTexts(item);

            return (
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
                <TableCell>
                  <div className="flex items-center justify-center">
                    <CreatorPlatform
                      platform={findPlatform(item.platformIdx)}
                    />
                  </div>
                </TableCell>
                <TableCell className="max-w-0 truncate">
                  {findCategoryName(item.categoryIdx) ?? EMPTY_VALUE}
                </TableCell>
                <TableCell>{metrics.followers}</TableCell>
                <TableCell>{metrics.brandIndex}</TableCell>
                <TableCell>{metrics.groupBuyIndex}</TableCell>
                <TableCell>{metrics.commentWriters}</TableCell>
                <TableCell>{metrics.expectedCost}</TableCell>
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
            );
          })}
        </TableBody>
      </Table>
      {footer}
      <ScrollBar orientation="horizontal" className="z-2" />
    </ScrollArea>
  );
}
