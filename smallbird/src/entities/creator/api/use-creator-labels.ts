import { useMatchingCategories, useMatchingPlatforms } from "./use-matching";

/** 행의 platformIdx·categoryIdx를 표시 값으로 바꿈. 옵션 목록을 아직 못 받았거나 모르는 idx면 찾지 못함. */
export function useCreatorLabels() {
  const { platforms } = useMatchingPlatforms();
  const { categories } = useMatchingCategories();

  return {
    findPlatform: (platformIdx: number) =>
      platforms.find((platform) => platform.platformIdx === platformIdx),
    findCategoryName: (categoryIdx: number) =>
      categories.find((category) => category.categoryIdx === categoryIdx)?.name,
  };
}
