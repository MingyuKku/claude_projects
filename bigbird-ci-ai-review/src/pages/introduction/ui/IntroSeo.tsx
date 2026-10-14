import { ENV, ROUTES } from "@/shared/config";

import {
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  PAGE_DESCRIPTION,
  PAGE_TITLE,
  SITE_NAME,
} from "../model/constants";

// React 19 hoists these tags into <head>.
export function IntroSeo() {
  // og:image must be absolute: the Kakao and Twitter crawlers cannot read a
  // relative path. The domain is injected at build time via VITE_DOMAIN.
  const origin = ENV.domain;

  return (
    <>
      <title>{PAGE_TITLE}</title>
      <meta name="description" content={PAGE_DESCRIPTION} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={PAGE_TITLE} />
      <meta property="og:description" content={PAGE_DESCRIPTION} />
      {/* Without a domain the absolute-URL tags are omitted entirely: an
          "undefined/og-image.png" thumbnail is worse than none. */}
      {origin && (
        <>
          <meta property="og:url" content={`${origin}${ROUTES.introduction}`} />
          <meta property="og:image" content={`${origin}${OG_IMAGE_PATH}`} />
          <meta property="og:image:type" content="image/png" />
          <meta property="og:image:width" content={OG_IMAGE_WIDTH} />
          <meta property="og:image:height" content={OG_IMAGE_HEIGHT} />
          <meta property="og:image:alt" content={OG_IMAGE_ALT} />
          {/* Twitter reads og tags, but the card type must be set for the large image. */}
          <meta name="twitter:card" content="summary_large_image" />
        </>
      )}
    </>
  );
}
