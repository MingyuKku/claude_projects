import { CreatorToolbar } from "@/entities/creator";
import { BasicFilterSelects } from "@/features/filter-creators";

import type { MatchingCategory, MatchingPlatform } from "@/entities/creator";
import type { BasicFilterValue } from "@/features/filter-creators";

interface ManageToolbarProps {
  isTabletUp: boolean;
  isDesktop: boolean;
  keyword: string;
  platforms: MatchingPlatform[];
  platformIdx: number | undefined;
  categories: MatchingCategory[];
  categoryIdxs: number[];
  allCategoryName: string | undefined;
  cost: BasicFilterValue["cost"];
  isOptionsLoading: boolean;
  onSubmitKeyword: (keyword: string) => void;
  onChangePlatform: (platform: MatchingPlatform | undefined) => void;
  onChangeCategoryIdxs: (categoryIdxs: number[]) => void;
  onChangeCost: (cost: BasicFilterValue["cost"]) => void;
  onClickRefresh: () => void;
  onClickBasicFilter: () => void;
  onClickDetailFilter: () => void;
}

export function ManageToolbar({
  platforms,
  platformIdx,
  categories,
  categoryIdxs,
  allCategoryName,
  cost,
  isOptionsLoading,
  onChangePlatform,
  onChangeCategoryIdxs,
  onChangeCost,
  onClickBasicFilter,
  ...props
}: ManageToolbarProps) {
  return (
    <CreatorToolbar
      {...props}
      onClickBasicFilter={isOptionsLoading ? undefined : onClickBasicFilter}
      filterSelects={
        <BasicFilterSelects
          platforms={platforms}
          platformIdx={platformIdx}
          categories={categories}
          categoryIdxs={categoryIdxs}
          allCategoryName={allCategoryName}
          cost={cost}
          isDisabled={isOptionsLoading}
          onChangePlatform={onChangePlatform}
          onChangeCategoryIdxs={onChangeCategoryIdxs}
          onChangeCost={onChangeCost}
        />
      }
    />
  );
}
