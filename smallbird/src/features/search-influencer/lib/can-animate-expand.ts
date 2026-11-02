import { REDUCED_MOTION_MEDIA_QUERY } from "../model/constants";

// Web Animations를 지원하고 모션 줄이기를 켜지 않았을 때만 펼침·축소를 전환으로 보여 줌.
export function canAnimateExpand() {
  if (typeof Element === "undefined") return false;
  if (typeof Element.prototype.animate !== "function") return false;
  return !window.matchMedia?.(REDUCED_MOTION_MEDIA_QUERY).matches;
}
