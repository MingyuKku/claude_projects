import type { ProfileFilters, RangeFilters } from "@/entities/creator";

export interface DetailFilterValue {
  ranges: RangeFilters;
  profile: ProfileFilters;
}

export const EMPTY_DETAIL_FILTER: DetailFilterValue = {
  ranges: {},
  profile: {},
};

export function hasDetailFilter({ ranges, profile }: DetailFilterValue) {
  return Object.keys(ranges).length > 0 || Object.keys(profile).length > 0;
}
