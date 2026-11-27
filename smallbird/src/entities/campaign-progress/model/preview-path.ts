import { generatePath } from "react-router";

import { ROUTES } from "@/shared/config";

/** 포스팅 가이드 미리보기(새 탭). */
export function getPostingGuidePreviewPath(campaignIdx: number) {
  return generatePath(ROUTES.campaignGuidePreview, {
    campaignIdx: String(campaignIdx),
  });
}
