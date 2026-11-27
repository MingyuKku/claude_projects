import { isApiError, serverApiV3 } from "@/shared/api";

import {
  toBasicConditionRequest,
  transformPostingGuide,
  transformPostingGuidePayment,
  transformPostingGuidePreview,
} from "../lib/transform-posting-guide";
import {
  postingGuidePaymentSchema,
  postingGuidePreviewSchema,
  postingGuideSchema,
} from "../model/posting-guide-schema";

import type {
  PostingGuide,
  PostingGuideBasicCondition,
  PostingGuideMethod,
  PostingGuidePayment,
  PostingGuidePreview,
} from "../model/posting-guide";

function guidePath(campaignIdx: number, rest = "") {
  return `/campaign/${campaignIdx}/posting-guide${rest}`;
}

function parseGuide(response: unknown) {
  return transformPostingGuide(postingGuideSchema.parse(response));
}

/** 가이드 상세. 아직 만든 적이 없으면 서버가 404를 주고, 화면은 null(작성 전)로 받음. */
export async function fetchPostingGuide(
  campaignIdx: number,
): Promise<PostingGuide | null> {
  try {
    return parseGuide(await serverApiV3.get(guidePath(campaignIdx)));
  } catch (error) {
    if (isApiError(error) && error.status === 404) return null;
    throw error;
  }
}

/** 작성 방식을 골라 가이드를 만듦. 캠페인당 한 번만 되고 이미 있으면 409(백엔드 요청 B-12). */
export async function startPostingGuide(
  campaignIdx: number,
  method: PostingGuideMethod,
) {
  return parseGuide(
    await serverApiV3.post(guidePath(campaignIdx), { creationMethod: method }),
  );
}

/** 기본 조건 저장. 따로 임시저장 API가 없고 이 저장이 곧 작성 중(DRAFT) 저장. */
export async function savePostingGuideBasicCondition(
  campaignIdx: number,
  condition: PostingGuideBasicCondition,
) {
  return parseGuide(
    await serverApiV3.put(
      guidePath(campaignIdx, "/basic-condition"),
      toBasicConditionRequest(condition),
    ),
  );
}

/** 예시 탭의 콘텐츠 개요 저장. 전체 교체라 빈 값이면 지워짐. */
export async function savePostingGuideContent(
  campaignIdx: number,
  contentGuide: string,
) {
  return parseGuide(
    await serverApiV3.put(guidePath(campaignIdx, "/examples"), {
      contentGuide: contentGuide.trim() || null,
    }),
  );
}

/** 미리보기(캠페인 정보 + 지금까지 저장한 가이드). */
export async function fetchPostingGuidePreview(
  campaignIdx: number,
): Promise<PostingGuidePreview> {
  return transformPostingGuidePreview(
    postingGuidePreviewSchema.parse(
      await serverApiV3.get(guidePath(campaignIdx, "/preview")),
    ),
  );
}

/** 건너뛰기. 가이드가 없어도 되고, 쓰던 내용은 지우지 않음. */
export async function skipPostingGuide(campaignIdx: number) {
  return parseGuide(await serverApiV3.post(guidePath(campaignIdx, "/skip")));
}

/** 확정. 확정 뒤에는 고칠 수 없음(REQ-14-0028). */
export async function confirmPostingGuide(campaignIdx: number) {
  return parseGuide(await serverApiV3.put(guidePath(campaignIdx, "/confirm")));
}

/** AI 가이드 결제 화면 값. `isPaid`면(등록 때 구독 포함) AI 방식을 쓸 수 있음. */
export async function fetchPostingGuidePayment(
  campaignIdx: number,
): Promise<PostingGuidePayment> {
  return transformPostingGuidePayment(
    postingGuidePaymentSchema.parse(
      await serverApiV3.get(guidePath(campaignIdx, "/payment")),
    ),
  );
}
