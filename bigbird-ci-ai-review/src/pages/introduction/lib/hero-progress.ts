/**
 * Converts a scroll offset into the hero shrink progress (0 to 1).
 *
 * Out-of-range input is clamped: iOS bounce scrolling reports negative offsets,
 * and scrolling past the shrink distance must keep the hero fully shrunk.
 *
 * @param scrollTop current scrollTop of the scroll container
 * @param shrinkDistance scroll distance (px) at which the shrink completes
 */
export function calcHeroProgress(
  scrollTop: number,
  shrinkDistance: number,
): number {
  if (shrinkDistance <= 0) return 1;
  const ratio = scrollTop / shrinkDistance;
  if (ratio < 0) return 0;
  if (ratio > 1) return 1;
  return ratio;
}
