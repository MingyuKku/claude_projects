// This screen has its own forbidden-word list; it differs from the sign-up one.
export const FORBIDDEN_WORDS = ["admin", "concepters", "bigbird"];

export const PASSWORD_HINT =
  "영문, 숫자, 특수문자를 조합 8-20자로 입력해주세요.";
export const PASSWORD_FORMAT_ERROR =
  "최소 8자리 이상(영문,숫자,특수문자 포함 8~20자로 입력해주세요)";
export const PASSWORD_MISMATCH = "비밀번호가 불일치합니다. 다시 입력해주세요.";

export const SUBMIT_REQUIRED_MESSAGE = "비밀번호를 입력해주세요.";
export const UNKNOWN_ERROR_MESSAGE = "알 수 없는 에러가 발생하였습니다.";
export const DELAY_ERROR_MESSAGE = "잠시 후 다시 시도해주세요.";

export const EXPIRED_ERROR_MESSAGES = {
  containsPersonalInfo: "개인 신상정보를 포함한 비밀번호는 사용을 금지합니다.",
  passwordsDiffer: "새 비밀번호와 확인 비밀번호는 다를 수 없습니다.",
  notReachedSemiAnnual: "6개월이 지나지 않았습니다.",
  sameAsOriginal: "새 비밀번호는 원래 비밀번호와 같을 수 없습니다.",
  originalInvalid: "기존 비밀번호가 잘못되었습니다.",
  fallback: "에러가 발생하였습니다. 관리자에게 문의해주세요.",
} as const;
