import { MEDIA_QUERY } from "@/shared/config";

// Web Animations를 지원하고 모션 줄이기를 켜지 않았을 때만 펼침·축소를 전환으로 보여 줌.
export function canAnimateExpand() {
  if (typeof Element === "undefined") return false;
  if (typeof Element.prototype.animate !== "function") return false;
  return !window.matchMedia?.(MEDIA_QUERY.reducedMotion).matches;
}
