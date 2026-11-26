import { tryit } from "radash";

import {
  isUnreadableCampaignError,
  loadCampaignDetail,
  parseCampaignIdx,
  toCampaignProgressStep,
} from "@/entities/campaign";
import { entryRedirect, NotFoundError } from "@/shared/lib";

import { getProgressRedirectPath } from "./steps";

import type { LoaderFunctionArgs } from "react-router";

// 그리기 전에 최신 상세로 이 캠페인·단계를 열 수 있는지 정함.
export async function campaignProgressLoader({ params }: LoaderFunctionArgs) {
  const campaignIdx = parseCampaignIdx(params.campaignIdx);
  if (campaignIdx === null) throw new NotFoundError();
  const [error, detail] = await tryit(loadCampaignDetail)(campaignIdx);
  if (error) {
    if (isUnreadableCampaignError(error)) throw new NotFoundError();
    throw error;
  }
  const redirectPath = getProgressRedirectPath(
    detail,
    params.step,
    toCampaignProgressStep(params.step),
  );
  if (redirectPath) throw entryRedirect(redirectPath);
  return null;
}
