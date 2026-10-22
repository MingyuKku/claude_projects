import type { TermsFields } from "./types";

/** 가입은 5단계(인증·정보·회사·약관·완료)이고, 헤더 진행 바가 현재 위치를 보여 줌. */
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

/** 번역 키(`cert.notice.{key}`). */
export const CERT_INTRO_NOTICES = ["privacy", "passApp"] as const;

export const ACCOUNT_INPUT_MAX_LENGTH = 20;
export const CONTACT_MAX_DIGITS = 11;
export const BUSINESS_NUMBER_DIGITS = 10;
export const MAILORDER_YEAR_INDEX = 0;
export const MAILORDER_REGION_INDEX = 1;
export const MAILORDER_SERIAL_INDEX = 2;
export const MAILORDER_YEAR_DIGITS = 4;
export const MAILORDER_SERIAL_DIGITS = 5;
export const MAILORDER_REGION_MAX_LENGTH = 4;
export const NOT_HANGUL_PATTERN = /[^가-힣]/g;

/** 입력이 잠시 멈춘 뒤 중복확인을 보내, 포커스가 빠지기 전에 결과가 나오게 함. */
export const EMAIL_CHECK_DEBOUNCE_MS = 300;

export const DEV_CERT_SKIP = {
  certIdx: 1,
  name: "테스트",
  phoneNumber: "01000000000",
} as const;

/** 라벨·제목은 번역 키(`terms.item.{key}.…`)에서, 본문은 `entities/terms`의 같은 이름 약관에서 가져옴. */
export interface TermsItem {
  key: keyof TermsFields;
}

export const TERMS_ITEMS: TermsItem[] = [
  { key: "service" },
  { key: "privacy" },
];
