/** 이미지 업로드 규칙: JPG·PNG, 10MB 이하(브랜드 이미지와 5단계 메인 이미지가 같음, 스펙 P-12). */
export const IMAGE_ACCEPT = "image/jpeg,image/png";
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const IMAGE_TYPES = IMAGE_ACCEPT.split(",");

export type ImageFileError = "format" | "size";

/** 올리기 전에 형식·용량을 확인함. 문제가 없으면 null. 서버도 같은 규칙으로 다시 검사함. */
export function validateImageFile(file: File): ImageFileError | null {
  if (!IMAGE_TYPES.includes(file.type)) return "format";
  if (file.size > MAX_IMAGE_BYTES) return "size";
  return null;
}
