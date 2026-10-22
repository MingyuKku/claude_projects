import { ROUTES } from "./routes";

/** 약관 화면(`ROUTES.terms`)이 문서 종류를 읽는 쿼리 키. */
export const TERMS_TYPE_PARAM = "type";

export const TERMS_TYPE = {
  service: "service",
  privacy: "privacy",
} as const;

/** 로그인 계열 화면 하단의 약관 링크. 모바일에서는 같은 항목이 "더보기" 메뉴에 들어감. */
export const TERMS_LINKS = [
  {
    to: `${ROUTES.terms}?${TERMS_TYPE_PARAM}=${TERMS_TYPE.privacy}`,
    labelKey: "link.privacy",
  },
  {
    to: `${ROUTES.terms}?${TERMS_TYPE_PARAM}=${TERMS_TYPE.service}`,
    labelKey: "link.terms",
  },
] as const;
