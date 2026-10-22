/**
 * 스크롤 오프셋을 히어로 축소 진행도(0~1)로 바꿈.
 *
 * 범위를 벗어난 입력은 누름: iOS 바운스 스크롤은 음수 오프셋을 보고하고,
 * 축소 거리를 넘어 스크롤해도 히어로는 완전히 축소된 상태를 유지해야 함.
 *
 * @param scrollTop 스크롤 컨테이너의 현재 scrollTop
 * @param shrinkDistance 축소가 끝나는 스크롤 거리(px)
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
