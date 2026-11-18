/** 로그인 전 연동(`POST /v3/auth/sns/link`)이 아이디·비밀번호 불일치에 주는 `reason`. */
export const INVALID_CREDENTIALS_REASON = "INVALID_CREDENTIALS";

export const TABS = [
  { key: "signup", labelKey: "tab.signup" },
  { key: "link", labelKey: "tab.link" },
] as const;

export type Tab = (typeof TABS)[number]["key"];
