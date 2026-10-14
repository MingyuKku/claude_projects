export const MAX_SEND_COUNT = 3;
export const AUTH_NUMBER_MAX_TRY = 3;

export const REQUEST_AGAIN_MESSAGE = "인증번호를 다시 요청한 뒤 확인해 주세요.";
export const INVALID_EMAIL_MESSAGE = "잘못된 이메일 형식입니다";
export const AUTH_NUMBER_MISMATCH_MESSAGE = "인증번호가 일치하지 않습니다.";
export const TIME_OUT_MESSAGE = "입력시간 초과되었습니다";
export const MAIL_SERVER_ERROR_MESSAGE =
  "메일 서버에 문제가 있습니다. 잠시 후 다시 시도해 주세요.";

export const SECONDS_PER_MINUTE = 60;

export const CERT_METHODS = [
  { key: "email", label: "이메일" },
  { key: "phone", label: "카카오톡" },
] as const;
