// 업로드 파일 규칙. 서버도 확장자가 아닌 실제 형식을 검사하지만(A-7), 고르는 즉시 안내하려고 화면에서 먼저 막음.

/** 브랜드 이미지·소개서 이미지: JPG·PNG 10MB 이하(REQ-10-0019·0059). */
export const IMAGE_ACCEPT = "image/jpeg,image/png";
const IMAGE_TYPES = ["image/jpeg", "image/png"];
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

/** 동영상 파일당 500MB 이하. 서버 공통 업로드 한도와 같음. */
const VIDEO_MAX_BYTES = 500 * 1024 * 1024;

/** 소개서 상세 미디어: 이미지는 위 규칙, 동영상은 용량만 봄(형식은 서버가 실제 파일로 검사함). */
export const DETAIL_MEDIA_ACCEPT = `${IMAGE_ACCEPT},video/*`;

export type FileRuleError = "type" | "size";
export type MediaRuleError = FileRuleError | "videoSize";

export function checkImageFile(file: File): FileRuleError | null {
  if (!IMAGE_TYPES.includes(file.type)) return "type";
  if (file.size > IMAGE_MAX_BYTES) return "size";
  return null;
}

export function checkDetailMediaFile(file: File): MediaRuleError | null {
  if (file.type.startsWith("video/")) {
    return file.size > VIDEO_MAX_BYTES ? "videoSize" : null;
  }
  return checkImageFile(file);
}
