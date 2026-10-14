import { ROUTES } from "@/shared/config";

export const LINK_FAILED_MESSAGE =
  "연동되지 않았습니다. 관리자에게 문의해주세요";
export const LOGIN_ERROR_MESSAGE = "로그인 중 오류가 발생했습니다";
export const CREDENTIAL_REQUIRED_MESSAGE =
  "아이디/비밀번호를 모두 입력해 주세요";
export const CREDENTIAL_MISMATCH_MESSAGE =
  "입력하신 아이디와 비밀번호가 등록된 정보와 일치하지 않습니다";
export const MISSING_SNS_DATA_MESSAGE = "SNS 연동 정보가 없습니다";

export const LINK_SUCCESS_CODE = 200;

export const TABS = [
  { key: "signup", label: "가입하기" },
  { key: "link", label: "SNS 계정 연동" },
] as const;

export type Tab = (typeof TABS)[number]["key"];

export const TERMS_LINKS = [
  { to: `${ROUTES.terms}?type=privacy`, label: "개인정보처리방침" },
  { to: `${ROUTES.terms}?type=service`, label: "이용약관" },
] as const;
