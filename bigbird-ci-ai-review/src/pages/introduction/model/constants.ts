import { ROUTES } from "@/shared/config";

export const PAGE_TITLE =
  "빅버드 — 인플루언서 마케팅, 이제 데이터로 더 정확하게";
export const PAGE_DESCRIPTION =
  "빅버드는 광고주 상품과 캠페인 목적에 맞는 인플루언서를 매칭하고, " +
  "콘텐츠 집행부터 모니터링, 효과 분석까지 연결합니다.";
export const SITE_NAME = "빅버드(BIGBIRD)";
export const OG_IMAGE_PATH = "/og-image.png";
export const OG_IMAGE_WIDTH = "1200";
export const OG_IMAGE_HEIGHT = "630";
export const OG_IMAGE_ALT = "매칭부터 협업까지, 인플루언서와 쉽게 협업하세요";

/**
 * `?login=1` makes the main route skip the guard that sends logged-out visitors
 * back to the introduction page; without it they would loop here.
 */
export const MAIN_LOGIN_HREF = `${ROUTES.main}?login=1`;

/** The legacy user-guide route is not migrated into this app yet. */
export const LEGACY_GUIDE_PATH = "/clientguide";

export const TERMS_OF_SERVICE_HREF = ROUTES.terms;
export const PRIVACY_POLICY_HREF = `${ROUTES.terms}?type=privacy`;

/** Scroll distance (px) at which the hero shrink completes. Tuned by eye in the browser. */
export const HERO_SHRINK_DISTANCE = 400;
