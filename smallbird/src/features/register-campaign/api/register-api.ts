import { campaignFileSchema } from "@/entities/campaign";

import {
  introGenerationSchema,
  introGenerationStartSchema,
  purchaseUrlCheckSchema,
} from "../model/schema";
import { loadMockRegisterApi } from "./load-mock-api";

import type { FileUploadKind } from "../model/schema";

// 요구 명세 A-8·A-9·A-10. API가 없는 동안은 개발 서버에서만 목이 응답하고, 응답은 실제 API와 같은 스키마로 검증함.

/**
 * A-8 `POST /v3/campaign/files`. 파일을 고르는 즉시 올리고 받은 `fileId`를 초안·브랜드 추가에 넣음.
 * 형식·용량 오류는 400 `INVALID_FILE_TYPE`·`FILE_TOO_LARGE`로 던져짐.
 */
export async function uploadCampaignFile(file: File, kind: FileUploadKind) {
  const mock = await loadMockRegisterApi();
  return campaignFileSchema.parse(await mock.uploadFile(file, kind));
}

/** A-9 `POST /v3/campaign/purchase-url/check`. 구매처 링크가 유효한지 서버가 확인함. */
export async function checkPurchaseUrl(url: string) {
  const mock = await loadMockRegisterApi();
  return purchaseUrlCheckSchema.parse(await mock.checkPurchaseUrl(url));
}

/** A-10 `POST /v3/campaign/{id}/intro/ai`. 작업을 시작하고 `jobId`를 받음. 이미 생성 중이면 409 `GENERATION_IN_PROGRESS`. */
export async function startIntroGeneration(
  campaignIdx: number,
  sourceUrl: string,
) {
  const mock = await loadMockRegisterApi();
  return introGenerationStartSchema.parse(
    await mock.startIntroGeneration(campaignIdx, sourceUrl),
  );
}

/** A-10 `GET /v3/campaign/{id}/intro/ai/{jobId}`. 화면은 5초마다 조회함. */
export async function fetchIntroGeneration(campaignIdx: number, jobId: string) {
  const mock = await loadMockRegisterApi();
  return introGenerationSchema.parse(
    await mock.getIntroGeneration(campaignIdx, jobId),
  );
}
