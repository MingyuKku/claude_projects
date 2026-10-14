import { ROUTES } from "@/shared/config";

/** Footer links on desktop; the same items go into the "more" menu on mobile. */
export const TERMS_LINKS = [
  { to: `${ROUTES.terms}?type=privacy`, label: "개인정보처리방침" },
  { to: `${ROUTES.terms}?type=service`, label: "이용약관" },
] as const;

export const QUESTION_PHONE_NUMBER = "1661-6213";
export const QUESTION_HOURS =
  "평일: 10:00 ~ 18:30\noff-time: 12:30 ~ 13:30\n(공휴일 휴무)";
export const HISTORY_BACK = -1;
