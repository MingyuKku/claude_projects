import { readApiErrorReason } from "@/shared/api";

const UPLOAD_ERROR_KEYS = {
  INVALID_FILE_TYPE: "toast.fileType",
  FILE_TOO_LARGE: "toast.fileSize",
  // 서버 공통 한도(파일당 500MB) 초과만 다른 코드 모양으로 옴
  "max upload size error": "toast.videoSize",
} as const;

/** 업로드 실패 사유(서버 `reason`)의 토스트 번역 키. 형식·용량은 안내 문구를, 그 밖은 일반 실패 문구를 씀. */
export function getUploadErrorKeyByReason(reason: string | undefined) {
  if (reason !== undefined && reason in UPLOAD_ERROR_KEYS) {
    return UPLOAD_ERROR_KEYS[reason as keyof typeof UPLOAD_ERROR_KEYS];
  }
  return "toast.saveFailed";
}

/** 업로드 실패 토스트의 번역 키. */
export function getUploadErrorKey(error: unknown) {
  return getUploadErrorKeyByReason(readApiErrorReason(error));
}
