import { tryit } from "radash";

import {
  isUnreadableCampaignError,
  loadCampaignDetail,
  parseCampaignIdx,
} from "@/entities/campaign";
import { entryRedirect, NotFoundError } from "@/shared/lib";

import { getDetailRedirectPath, getRegisterRedirectPath } from "./entry";

import type {
  LoaderFunctionArgs,
  ShouldRevalidateFunction,
} from "react-router";

// 작성 화면과 등록 내역 중 어디서 보여 줄지를 그리기 전에 최신 상세로 정함. 그동안 라우터가 이전 화면을 그대로 둠.

async function loadEntryDetail({ params }: LoaderFunctionArgs) {
  const campaignIdx = parseCampaignIdx(params.campaignIdx);
  if (campaignIdx === null) throw new NotFoundError();
  const [error, detail] = await tryit(loadCampaignDetail)(campaignIdx);
  if (error) {
    if (isUnreadableCampaignError(error)) throw new NotFoundError();
    throw error;
  }
  return detail;
}

export async function campaignRegisterLoader(args: LoaderFunctionArgs) {
  const redirectPath = getRegisterRedirectPath(await loadEntryDetail(args));
  if (redirectPath) throw entryRedirect(redirectPath);
  return null;
}

export async function campaignDetailLoader(args: LoaderFunctionArgs) {
  const redirectPath = getDetailRedirectPath(await loadEntryDetail(args));
  if (redirectPath) throw entryRedirect(redirectPath);
  return null;
}

/** 같은 화면 안의 쿼리 변경(단계 이동, 결제 서버 복귀 쿼리)에서는 다시 읽지 않음. */
export const revalidateOnPathChange: ShouldRevalidateFunction = ({
  currentUrl,
  nextUrl,
}) => currentUrl.pathname !== nextUrl.pathname;
