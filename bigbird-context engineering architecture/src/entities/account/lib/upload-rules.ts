// 마이페이지 업로드 규칙(Figma 안내 기준). 회원가입(`join-validation`)은 5MB에 gif·bmp까지
// 허용하는 별개의 규칙이라 섞지 않음. 서버 한도는 확인 전(스펙 §7 B-5)이라 프론트가 먼저 막음.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** 서류(사업자 등록증·통신판매업 신고증·통장 사본). */
export const DOCUMENT_EXTENSIONS = ["jpg", "jpeg", "png", "pdf"] as const;

/** 프로필 이미지. */
export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png"] as const;

export type UploadRejection = "extension" | "size";

interface UploadCandidate {
  name: string;
  size: number;
}

/** 형식·용량 위반이면 그 종류를, 통과하면 null을 돌려줌. 형식을 먼저 봄. */
export function checkUploadFile(
  file: UploadCandidate,
  extensions: readonly string[],
): UploadRejection | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!extensions.includes(extension)) return "extension";
  if (file.size > MAX_UPLOAD_BYTES) return "size";
  return null;
}

const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * 1024;

/** 파일 목록에 보이는 용량. 1KB 미만은 Bytes, 1MB 미만은 KB, 그 이상은 소수 첫째 자리 MB. */
export function formatFileSize(bytes: number) {
  if (bytes < BYTES_PER_KB) return `${bytes}Bytes`;
  if (bytes < BYTES_PER_MB) return `${Math.round(bytes / BYTES_PER_KB)}KB`;
  return `${(bytes / BYTES_PER_MB).toFixed(1)}MB`;
}
