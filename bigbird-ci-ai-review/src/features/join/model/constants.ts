import {
  PRIVACY_POLICY_CONTENT,
  TERMS_OF_SERVICE_CONTENT,
} from "@/entities/terms";

import type { TermsFields } from "./types";
import type { TermsBlock } from "@/entities/terms";

/** Join is a 5-step flow (cert, info, company, terms, done); the header bar shows how far along. */
const JOIN_STEP_COUNT = 5;

export const JOIN_STEP_PROGRESS = {
  cert: 1 / JOIN_STEP_COUNT,
  info: 2 / JOIN_STEP_COUNT,
  company: 3 / JOIN_STEP_COUNT,
  terms: 4 / JOIN_STEP_COUNT,
} as const;

export const KMC_CERT_URL = "https://www.kmcert.com/kmcis/web/kmcisReq.jsp";
export const KMC_POPUP_NAME = "KMCISWindow";
export const KMC_POPUP_FEATURES =
  "width=396, height=643, resizable=0, scrollbars=no, status=0, titlebar=0, toolbar=0, left=435, top=250";

export const CERT_INTRO_NOTICES = [
  "본인확인 절차를 위한 본인인증이며, 회원님의 개인정보를 다른 목적으로 활용하지 않습니다.",
  "PASS 앱이 설치 되어 있나요? 본인인증에 필요해요.",
];

export const ACCOUNT_INPUT_MAX_LENGTH = 20;
export const CONTACT_MAX_DIGITS = 11;
export const BUSINESS_NUMBER_DIGITS = 10;
export const MAILORDER_YEAR_DIGITS = 4;
export const MAILORDER_SERIAL_DIGITS = 5;
export const MAILORDER_REGION_MAX_LENGTH = 4;
export const NOT_HANGUL_PATTERN = /[^가-힣]/g;

/** Lets the email duplicate check finish before blur by collecting keystrokes briefly. */
export const EMAIL_CHECK_DEBOUNCE_MS = 300;

export const COMPANY_URL_FORMAT_ERROR_MESSAGE = "올바른 URL 형식이 아닙니다.";
export const JOIN_FAILED_MESSAGE = "가입 실패하였습니다";
export const ID_CHECK_ERROR_MESSAGE = "아이디 확인 중 오류가 발생했습니다";
export const EMAIL_CHECK_ERROR_MESSAGE = "이메일 확인 중 오류가 발생했습니다";
export const CERT_FAIL_FALLBACK_MESSAGE = "인증 중 오류가 발생했습니다";

export const DEV_CERT_SKIP = {
  certIdx: 1,
  name: "테스트",
  phoneNumber: "01000000000",
} as const;

export const UPLOAD_ERRORS = {
  extension: "이미지 또는 PDF 파일만 선택할 수 있습니다",
  size: "파일 용량은 5MB 이하만 업로드 가능합니다",
  upload: "파일업로드 오류가 발생하였습니다",
} as const;

export interface TermsItem {
  key: keyof TermsFields;
  label: string;
  title: string;
  content: TermsBlock[];
}

export const TERMS_ITEMS: TermsItem[] = [
  {
    key: "service",
    label: "(필수) 이용약관 동의",
    title: "이용약관동의",
    content: TERMS_OF_SERVICE_CONTENT,
  },
  {
    key: "privacy",
    label: "(필수) 개인정보처리방침",
    title: "개인정보처리방침",
    content: PRIVACY_POLICY_CONTENT,
  },
];
