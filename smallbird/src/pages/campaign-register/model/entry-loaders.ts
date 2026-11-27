import { tryit } from "radash";

import {
  createCampaign,
  getCampaignRegisterPath,
  isUnreadableCampaignError,
  loadCampaignDetail,
  parseCampaignIdx,
} from "@/entities/campaign";
import { entryRedirect, NotFoundError } from "@/shared/lib";

import {
  getDetailRedirectPath,
  getRegisterRedirectPath,
  parseRegisterEntry,
} from "./entry";

import type {
  LoaderFunctionArgs,
  ShouldRevalidateFunction,
} from "react-router";

// 작성 화면과 등록 내역 중 어디서 보여 줄지를 그리기 전에 최신 상세로 정함. 그동안 라우터가 이전 화면을 그대로 둠.

/**
 * 새 캠페인 진입. 만든 뒤 작성 경로로 보내 진입 주소는 그려지지도 기록에 남지도 않음.
 * 만드는 동안과 작성 화면을 불러오는 동안 라우터가 이전 화면을 그대로 둠.
 */
export async function campaignRegisterEntryLoader({
  request,
}: LoaderFunctionArgs) {
  const entry = parseRegisterEntry(new URL(request.url).searchParams);
  if (entry.kind === "invalid") throw new NotFoundError();
  if (entry.kind === "comingSoon") return null;
  const created = await createCampaign({
    serviceType: "PICK",
    productType: entry.productType,
    demo: entry.isDemo,
  });
  throw entryRedirect(
    getCampaignRegisterPath(created.campaignIdx, "campaign-info"),
  );
}

/** 진입 loader는 캠페인을 만들므로 다시 돌면 하나가 더 생김. */
export const neverRevalidate: ShouldRevalidateFunction = () => false;

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
