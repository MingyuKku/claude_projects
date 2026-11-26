import { RefreshCcw } from "lucide-react";
import { isEqual } from "radash";
import { useState } from "react";

import { CreatorPanel, useCreatorTerms } from "@/entities/creator";
import { ScrollPanel } from "@/shared/components/scroll-panel";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { EMPTY_COST_FILTER } from "../model/cost-filter";
import { CategorySelect } from "./CategorySelect";
import { CostFilterPopover } from "./CostFilterPopover";
import { PlatformSelect } from "./PlatformSelect";

import type { CostFilterValue } from "../model/cost-filter";
import type { MatchingCategory, MatchingPlatform } from "@/entities/creator";
import type { ReactNode } from "react";

export interface BasicFilterValue {
  platform: MatchingPlatform | undefined;
  categoryIdxs: number[];
  cost: CostFilterValue;
}

interface BasicFilterPanelProps {
  /** 메뉴 순서대로. */
  platforms: MatchingPlatform[];
  categories: MatchingCategory[];
  allCategoryName: string | undefined;
  value: BasicFilterValue;
  onApply: (value: BasicFilterValue) => void;
  onClose: () => void;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm leading-5 font-medium text-foreground">{label}</p>
      {children}
    </div>
  );
}

// MO 전체 화면 `기본 필터 설정`. 고른 값은 `적용하기`를 눌러야 목록에 반영됨.
export function BasicFilterPanel({
  platforms,
  categories,
  allCategoryName,
  value,
  onApply,
  onClose,
}: BasicFilterPanelProps) {
  const { t } = useTranslation("features/filter-creators");
  const { term } = useCreatorTerms();
  const { t: tCommon } = useTranslation();
  const [draft, setDraft] = useState(value);

  const isChanged =
    draft.platform?.platformIdx !== value.platform?.platformIdx ||
    draft.categoryIdxs.join(",") !== value.categoryIdxs.join(",") ||
    !isEqual(draft.cost, value.cost);

  return (
    <CreatorPanel title={t("basicFilter.title")} onClose={onClose}>
      <ScrollPanel
        className="flex-1"
        contentClassName="flex flex-col gap-2 px-4 pt-4 pb-3"
      >
        <Field label={term("platform")}>
          <PlatformSelect
            platforms={platforms}
            platformIdx={draft.platform?.platformIdx}
            placeholder={t("basicFilter.platformPlaceholder")}
            onChangePlatform={(platform) => setDraft({ ...draft, platform })}
          />
        </Field>
        <Field label={term("category")}>
          <CategorySelect
            categories={categories}
            allLabel={allCategoryName}
            categoryIdxs={draft.categoryIdxs}
            placeholder={t("basicFilter.categoryPlaceholder")}
            onChangeCategoryIdxs={(categoryIdxs) =>
              setDraft({ ...draft, categoryIdxs })
            }
          />
        </Field>
        <Field label={t("toolbar.aiCost")}>
          <CostFilterPopover
            label={t("toolbar.aiCost")}
            placeholder={t("basicFilter.aiCostPlaceholder")}
            value={draft.cost.aiPredictedCost}
            onChangeValue={(aiPredictedCost) =>
              setDraft({ ...draft, cost: { ...draft.cost, aiPredictedCost } })
            }
          />
        </Field>
        <Field label={term("desiredCost")}>
          <CostFilterPopover
            label={term("desiredCost")}
            placeholder={t("basicFilter.desiredCostPlaceholder")}
            value={draft.cost.desiredCost}
            onChangeValue={(desiredCost) =>
              setDraft({ ...draft, cost: { ...draft.cost, desiredCost } })
            }
          />
        </Field>
      </ScrollPanel>
      <div className="flex shrink-0 gap-2 p-4">
        <Button
          variant="outline"
          className="h-9.5"
          onClick={() =>
            setDraft({
              platform: undefined,
              categoryIdxs: [],
              cost: EMPTY_COST_FILTER,
            })
          }
        >
          <RefreshCcw />
          {tCommon("list.filter.reset")}
        </Button>
        <Button
          className="h-9.5 flex-1"
          disabled={!isChanged}
          onClick={() => onApply(draft)}
        >
          {tCommon("list.filter.apply")}
        </Button>
      </div>
    </CreatorPanel>
  );
}
