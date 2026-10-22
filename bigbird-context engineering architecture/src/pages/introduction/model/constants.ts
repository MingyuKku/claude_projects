import { ROUTES, TERMS_TYPE, TERMS_TYPE_PARAM } from "@/shared/config";

// 페이지 제목·설명·사이트 이름·OG 이미지 설명은 번역 키 `seo.*`.
export const OG_IMAGE_PATH = "/og-image.png";
export const OG_IMAGE_WIDTH = "1200";
export const OG_IMAGE_HEIGHT = "630";

export const MAIN_LOGIN_HREF = ROUTES.main;

/** 기존 사용자 가이드 경로는 아직 이 앱으로 옮겨지지 않음. */
export const LEGACY_GUIDE_PATH = "/clientguide";

export const TERMS_OF_SERVICE_HREF = ROUTES.terms;
export const PRIVACY_POLICY_HREF = `${ROUTES.terms}?${TERMS_TYPE_PARAM}=${TERMS_TYPE.privacy}`;

/** 히어로 축소가 끝나는 스크롤 거리(px). 브라우저에서 눈으로 맞춘 값. */
export const HERO_SHRINK_DISTANCE = 400;
