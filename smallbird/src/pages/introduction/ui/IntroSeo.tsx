import { ENV, ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";

import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
} from "../model/constants";

// React 19 가 이 태그들을 <head> 로 끌어올림.
export function IntroSeo() {
  const { t } = useTranslation("pages/introduction");
  // og:image 는 절대 경로여야 함: 카카오·트위터 크롤러는 상대 경로를 읽지 못함.
  // 도메인은 빌드 때 VITE_DOMAIN 으로 주입함.
  const origin = ENV.domain;

  return (
    <>
      <title>{t("seo.title")}</title>
      <meta name="description" content={t("seo.description")} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={t("seo.siteName")} />
      <meta property="og:title" content={t("seo.title")} />
      <meta property="og:description" content={t("seo.description")} />
      {/* 도메인이 없으면 절대 URL 태그는 통째로 뺌: "undefined/og-image.png" 썸네일은 없는 것보다 나쁨. */}
      {origin && (
        <>
          <meta property="og:url" content={`${origin}${ROUTES.introduction}`} />
          <meta property="og:image" content={`${origin}${OG_IMAGE_PATH}`} />
          <meta property="og:image:type" content="image/png" />
          <meta property="og:image:width" content={OG_IMAGE_WIDTH} />
          <meta property="og:image:height" content={OG_IMAGE_HEIGHT} />
          <meta property="og:image:alt" content={t("seo.ogImageAlt")} />
          {/* 트위터는 og 태그를 읽지만 큰 이미지를 쓰려면 카드 유형을 지정해야 함. */}
          <meta name="twitter:card" content="summary_large_image" />
        </>
      )}
    </>
  );
}
