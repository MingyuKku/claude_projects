import { ChevronDown } from "lucide-react";

import { useCreatorTerms } from "@/entities/creator";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import {
  FILTER_MENU_ITEM_CLASS_NAME,
  FILTER_TRIGGER_CLASS_NAME,
} from "./filter-menu";
import { FilterMenuContent } from "./FilterMenuContent";

import type { MatchingCategory } from "@/entities/creator";

interface CategorySelectProps {
  categories: MatchingCategory[];
  /** 고른 순서대로. 비어 있으면 전체. */
  categoryIdxs: number[];
  isDisabled?: boolean;
  /** 고른 게 없을 때 트리거 문구. 없으면 `카테고리`. */
  placeholder?: string;
  /** 맨 위 '전체' 행 이름(서버 값). 누르면 고른 것을 모두 해제해 전체로 검색함. */
  allLabel: string | undefined;
  onChangeCategoryIdxs: (categoryIdxs: number[]) => void;
  className?: string;
}

// 다중 선택이라 Radix Select 대신 체크 메뉴. 고른 항목을 다시 누르면 해제하며 메뉴는 닫지 않음.
export function CategorySelect({
  categories,
  categoryIdxs,
  isDisabled = false,
  placeholder,
  allLabel,
  onChangeCategoryIdxs,
  className,
}: CategorySelectProps) {
  const { t } = useTranslation("features/filter-creators");
  const { term } = useCreatorTerms();

  const firstName = categories.find(
    (category) => category.categoryIdx === categoryIdxs[0],
  )?.name;

  function getTriggerText() {
    if (firstName === undefined) return placeholder ?? term("category");
    if (categoryIdxs.length === 1) return firstName;
    return t("category.more", {
      name: firstName,
      count: categoryIdxs.length - 1,
    });
  }

  function handleCheckedChange(categoryIdx: number, isChecked: boolean) {
    onChangeCategoryIdxs(
      isChecked
        ? [...categoryIdxs, categoryIdx]
        : categoryIdxs.filter((idx) => idx !== categoryIdx),
    );
  }

  return (
    <div className={cn("min-w-0 flex-1", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isDisabled}>
          <button
            type="button"
            aria-label={
              firstName === undefined
                ? term("category")
                : t("toolbar.selected", {
                    label: term("category"),
                    value: getTriggerText(),
                  })
            }
            className={FILTER_TRIGGER_CLASS_NAME}
          >
            <span className="truncate">{getTriggerText()}</span>
            <ChevronDown aria-hidden className="size-4 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <FilterMenuContent itemCount={categories.length + 1}>
          {allLabel && (
            <DropdownMenuCheckboxItem
              className={FILTER_MENU_ITEM_CLASS_NAME}
              checked={categoryIdxs.length === 0}
              onCheckedChange={() => onChangeCategoryIdxs([])}
              onSelect={(event) => event.preventDefault()}
            >
              {allLabel}
            </DropdownMenuCheckboxItem>
          )}
          {categories.map((category) => (
            <DropdownMenuCheckboxItem
              key={category.categoryIdx}
              className={FILTER_MENU_ITEM_CLASS_NAME}
              checked={categoryIdxs.includes(category.categoryIdx)}
              onCheckedChange={(isChecked) =>
                handleCheckedChange(category.categoryIdx, isChecked)
              }
              onSelect={(event) => event.preventDefault()}
            >
              {category.name}
            </DropdownMenuCheckboxItem>
          ))}
        </FilterMenuContent>
      </DropdownMenu>
    </div>
  );
}
