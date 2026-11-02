export const MAX_SEND_COUNT = 3;
export const AUTH_NUMBER_MAX_TRY = 3;

export const SECONDS_PER_MINUTE = 60;

export const CERT_METHODS = [
  { key: "email", labelKey: "methodEmail" },
  { key: "phone", labelKey: "methodKakao" },
] as const;

/** 회원 백엔드(`/find/*`) 응답의 `result` 성공 값. */
export const RESULT_SUCCESS = "success";

/** 회원 백엔드가 에러 본문에 담아 주는 실패 사유. 값은 서버 계약. */
export const EMAIL_REASON = {
  authNumMismatch: "authNum missmatch",
  timeOut: "time out",
  requestExists: "request exists",
  breakTime: "break time",
  noResult: "no result",
  mailServerError: "mail server error",
  neverRequested: "never requested",
} as const;
