import type { CreatorSearchFilters } from "@/entities/creator";

export type CostFilterValue = Pick<
  CreatorSearchFilters,
  "aiPredictedCost" | "desiredCost"
>;

export const EMPTY_COST_FILTER: CostFilterValue = {};
