import { useCreatorTerms } from "@/entities/creator";
import { useTranslation } from "@/shared/i18n";

import { CategorySelect } from "./CategorySelect";
import { CostFilterPopover } from "./CostFilterPopover";
import { PlatformSelect } from "./PlatformSelect";

import type { CostFilterValue } from "../model/cost-filter";
import type { MatchingCategory, MatchingPlatform } from "@/entities/creator";

interface BasicFilterSelectsProps {
  platforms: MatchingPlatform[];
  platformIdx: number | undefined;
  categories: MatchingCategory[];
  categoryIdxs: number[];
  allCategoryName: string | undefined;
  cost: CostFilterValue;
  isDisabled: boolean;
  onChangePlatform: (platform: MatchingPlatform | undefined) => void;
  onChangeCategoryIdxs: (categoryIdxs: number[]) => void;
  onChangeCost: (cost: CostFilterValue) => void;
}

export function BasicFilterSelects({
  platforms,
  platformIdx,
  categories,
  categoryIdxs,
  allCategoryName,
  cost,
  isDisabled,
  onChangePlatform,
  onChangeCategoryIdxs,
  onChangeCost,
}: BasicFilterSelectsProps) {
  const { t } = useTranslation("features/filter-creators");
  const { term } = useCreatorTerms();

  return (
    <>
      <PlatformSelect
        platforms={platforms}
        platformIdx={platformIdx}
        isDisabled={isDisabled}
        onChangePlatform={onChangePlatform}
      />
      <CategorySelect
        categories={categories}
        allLabel={allCategoryName}
        categoryIdxs={categoryIdxs}
        isDisabled={isDisabled}
        onChangeCategoryIdxs={onChangeCategoryIdxs}
      />
      <CostFilterPopover
        label={t("toolbar.aiCost")}
        value={cost.aiPredictedCost}
        onChangeValue={(aiPredictedCost) =>
          onChangeCost({ ...cost, aiPredictedCost })
        }
      />
      <CostFilterPopover
        label={term("desiredCost")}
        value={cost.desiredCost}
        onChangeValue={(desiredCost) => onChangeCost({ ...cost, desiredCost })}
      />
    </>
  );
}
