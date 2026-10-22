/** 화면에 보여 줄 문구의 번역 키(`message.{code}`). 문장은 렌더할 때 `t()`로 만듦. */
export type FindMessageCode =
  | "requestAgain"
  | "invalidEmail"
  | "authMismatch"
  | "authMismatchRemaining"
  | "timeOut"
  | "mailServerError"
  | "resendWait"
  | "breakTimeSeconds"
  | "breakTimeMinutes"
  | "notFoundEmail"
  | "notFoundPhone"
  | "emailSent"
  | "emailResent"
  | "kakaoSent"
  | "kakaoResent"
  | "authInfoNotFound"
  | "authExpired"
  | "authCodeInvalid"
  | "authLimit"
  | "notApproved"
  | "invalidParams"
  | "serverError"
  | "unknown";

export interface FindMessage {
  code: FindMessageCode;
  values?: Record<string, string | number>;
}
