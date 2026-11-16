// 업로드 파일 규칙. 서버도 확장자가 아닌 실제 형식을 검사하지만(A-7), 고르는 즉시 안내하려고 화면에서 먼저 막음.

/** 브랜드 이미지·소개서 이미지: JPG·PNG 10MB 이하(REQ-10-0019·0059). */
export const IMAGE_ACCEPT = "image/jpeg,image/png";
const IMAGE_TYPES = ["image/jpeg", "image/png"];
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export type FileRuleError = "type" | "size";

export function checkImageFile(file: File): FileRuleError | null {
  if (!IMAGE_TYPES.includes(file.type)) return "type";
  if (file.size > IMAGE_MAX_BYTES) return "size";
  return null;
}
