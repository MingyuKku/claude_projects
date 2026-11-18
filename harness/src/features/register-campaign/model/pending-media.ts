import { tryit } from "radash";

import { readApiErrorReason } from "@/shared/api";

import { uploadCampaignFile } from "../api/upload-campaign-file";

import type { RegisterWizardStoreApi } from "./store";
import type { CampaignIntroDraft, CampaignMedia } from "@/entities/campaign";

// 5단계 이미지·동영상은 고르기만 하고, 저장할 때(단계 이동·임시저장·이탈) 서버에 올림. 올리기 전 파일은 `file`을 가진
// 미디어이고 미리보기는 `blob:` 주소를 씀. 교체·삭제는 메모리에서만 일어나 서버에 쓰레기 파일이 남지 않음.

/** 동시에 올리는 파일 수. */
const UPLOAD_CONCURRENCY = 3;

export function createPendingMedia(file: File): CampaignMedia {
  return {
    attachmentIdx: null,
    url: URL.createObjectURL(file),
    mediaType: file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
    file,
  };
}

/** 미리보기 주소를 놓아 줌. 올린 파일이나 서버 파일이면 아무것도 안 함. */
export function revokePendingMedia(media: CampaignMedia | null | undefined) {
  if (media?.file) URL.revokeObjectURL(media.url);
}

/** 소개서에서 버려지는 올리기 전 파일의 미리보기 주소를 놓아 줌. */
export function revokePendingIntroMedia({
  mainImage,
  detailMedia,
}: Pick<CampaignIntroDraft, "mainImage" | "detailMedia">) {
  revokePendingMedia(mainImage);
  detailMedia.forEach(revokePendingMedia);
}

function getPendingFiles({
  mainImage,
  detailMedia,
}: Pick<CampaignIntroDraft, "mainImage" | "detailMedia">) {
  return [mainImage, ...detailMedia].flatMap((media) =>
    media?.file ? [media.file] : [],
  );
}

export type UploadPendingResult =
  { ok: true } | { ok: false; reason: string | undefined };

/**
 * 소개서에 남은 올리기 전 파일을 모두 올리고 받은 번호·주소로 바꿈. 하나라도 실패하면 그 사유를 돌려주고, 올라간 파일은
 * 그대로 바뀐 채라 다시 저장하면 실패한 파일만 올림.
 */
export async function uploadPendingIntroMedia(
  store: RegisterWizardStoreApi,
): Promise<UploadPendingResult> {
  const files = getPendingFiles(store.getState().draft.intro);
  if (files.length === 0) return { ok: true };

  const { setUploadProgress, resolvePendingMedia } = store.getState();
  let done = 0;
  let next = 0;
  let failure: UploadPendingResult | null = null;
  setUploadProgress({ done, total: files.length });

  async function worker() {
    for (let file = files[next++]; file && !failure; file = files[next++]) {
      const [error, uploaded] = await tryit(uploadCampaignFile)(file);
      if (error) {
        failure ??= { ok: false, reason: readApiErrorReason(error) };
        return;
      }
      resolvePendingMedia(file, uploaded);
      done += 1;
      setUploadProgress({ done, total: files.length });
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(UPLOAD_CONCURRENCY, files.length) }, worker),
  );
  setUploadProgress(null);
  return failure ?? { ok: true };
}
