import BANNER_BG from "../assets/banner-bg.jpg";
import CONTACT_LOGO from "../assets/contact-logo.svg";
import FOOTER_LOGO from "../assets/footer-logo.svg";
import HERO_CTA_ARROW from "../assets/hero-cta-arrow.svg";
import HERO_POSTER from "../assets/hero-poster.jpg";
import LOGO_BLACK from "../assets/logo-black.svg";
import LOGO_WHITE from "../assets/logo-white.svg";
import S1_CARD1_HOVER from "../assets/s1-card1-hover.png";
import S1_CARD1 from "../assets/s1-card1.png";
import S1_CARD2_SCREEN_HEAD from "../assets/s1-card2-screen-head.png";
import S1_CARD2_SCREEN from "../assets/s1-card2-screen.jpg";
import S1_CARD2 from "../assets/s1-card2.png";
import S1_CARD3_SCREEN_HEAD from "../assets/s1-card3-screen-head.png";
import S1_CARD3_SCREEN from "../assets/s1-card3-screen.jpg";
import S1_CARD3 from "../assets/s1-card3.png";
import S1_MOCKUP from "../assets/s1-mockup.png";
import S2_AWARDS from "../assets/s2-awards.svg";
import S2_AWS from "../assets/s2-aws.svg";
import S2_GOOGLE from "../assets/s2-google.svg";
import S2_SAMSUNG_FMM from "../assets/s2-samsung-fmm.svg";
import S2_SAMSUNG from "../assets/s2-samsung.svg";
import S4_ICON1 from "../assets/s4-icon1.png";
import S4_ICON2 from "../assets/s4-icon2.png";
import S4_ICON3 from "../assets/s4-icon3.png";
import S4_ICON4 from "../assets/s4-icon4.png";
import S4_ICON5 from "../assets/s4-icon5.png";
import S4_SPRITE_MO from "../assets/s4-sprite-mo.jpg";
import S4_SPRITE_PC from "../assets/s4-sprite-pc.jpg";
import S4_SPRITE_TAB from "../assets/s4-sprite-tab.jpg";
import S5_CARD1 from "../assets/s5-card1.jpg";
import S5_CARD2 from "../assets/s5-card2.jpg";
import S5_ICON_BASIC from "../assets/s5-icon-basic.svg";
import S5_ICON_LIVE from "../assets/s5-icon-live.svg";
import S5_ICON_OPENMARKET from "../assets/s5-icon-openmarket.svg";
import S5_ICON_PERFORMANCE from "../assets/s5-icon-performance.svg";
import S5_ICON_PREMIUM from "../assets/s5-icon-premium.svg";
import S6_SPRITE_MO1 from "../assets/s6-sprite-mo1.jpg";
import S6_SPRITE_MO2 from "../assets/s6-sprite-mo2.jpg";
import S6_SPRITE from "../assets/s6-sprite.jpg";
import {
  LEGACY_GUIDE_PATH,
  MAIN_LOGIN_HREF,
  PRIVACY_POLICY_HREF,
  TERMS_OF_SERVICE_HREF,
} from "./constants";

// 랜딩의 모든 문구와 이미지 경로가 여기에 있어, 목업을 바꿀 때는 이 파일만 고치면 됨.
// 비디오와 PDF 는 public/ 에 있어 절대 경로.
// 히어로의 최대 inset/반경은 일부러 여기에 없음: 반응형 값이라 IntroHero 의 Tailwind 클래스가 맡고,
// 그래야 브레이크포인트가 한곳에 모임.

export type ButtonVariant = "primary" | "secondary" | "ghost";

/** 문구는 번역 키(`hero.{key}` 등)에서 가져옴. 이 파일에는 자산·경로·구조만 둠. */
export interface IntroButton<Key extends string = string> {
  key: Key;
  href: string;
  variant: ButtonVariant;
  /** true 이면 저장 파일명을 번역 키 `hero.downloadName` 에서 가져와 내려받기로 처리함. */
  download?: boolean;
  icon?: string;
}

export interface HeroTitleLine {
  key: "line1" | "line2" | "line3";
  /** PC·TAB 에서 이 줄만 한 행을 혼자 차지함. */
  isOwnRow?: boolean;
  /** PC·TAB 에서 앞 줄에 이어 붙을 때 단어 사이 공백이 필요함. */
  hasLeadingSpace?: boolean;
}

/**
 * 히어로 문구와 에셋.
 *
 * 브로슈어 버튼은 PDF 를 바로 내려받음. 같은 출처(public/)라 새 탭을 여는 대신 `download` 속성이 동작함.
 * `poster` 는 `video` 의 첫 프레임: 로드 전이나 재생 실패 때의 대체 이미지이므로 비디오를 바꿀 때마다 다시 뽑음.
 * 보조 문구는 일부러 없음: 디자인에 없고, 지어내지 않음.
 */
export const hero = {
  video: "/media/intro/hero.mp4",
  poster: HERO_POSTER,
  // 줄바꿈은 화면마다 다름: PC·TAB 은 2줄(1행 / 2+3행), MO 는 3줄임.
  // 자동 줄바꿈에 맡기면 MO 가 구절 중간에서 끊김.
  // 번역 키 `hero.title.{line}`: 언어마다 세 줄로 나눠 씀.
  titleLines: [
    { key: "line1", isOwnRow: true },
    { key: "line2" },
    { key: "line3", hasLeadingSpace: true },
  ] satisfies HeroTitleLine[],
  buttons: [
    {
      key: "brochure",
      href: "/media/intro/bigbird-service-intro.pdf",
      download: true,
      variant: "secondary",
    },
    {
      key: "start",
      href: MAIN_LOGIN_HREF,
      variant: "primary",
      icon: HERO_CTA_ARROW,
    },
  ] satisfies IntroButton<"brochure" | "start">[],
};

/**
 * 헤더(GNB) 데이터.
 *
 * `logoLight` 는 임시 조치: 디자인에 흰색 로고가 없어 검은 로고의 fill 을 흰색으로 바꾼 것.
 * 실제 로고가 오면 logo-white.svg 를 교체함.
 */
export const header = {
  logoLight: LOGO_WHITE,
  logoDark: LOGO_BLACK,
  buttons: [
    { key: "guide", href: LEGACY_GUIDE_PATH, variant: "ghost" },
    { key: "start", href: MAIN_LOGIN_HREF, variant: "primary" },
  ] satisfies IntroButton<"guide" | "start">[],
};

export const section1 = {
  // 제목·설명은 번역 키 `section1.*`. 제목은 세 화면 모두 같은 자리에서 2줄로 끊김.
  cards: [
    {
      key: "advertiser" as const,
      image: S1_CARD1,
      hoverImage: S1_CARD1_HOVER,
      // 호버하면 모니터 화면 안에서 재생됨. 화면이 491:277 이라 16:9 비디오는 잘리는 것이 없음.
      // 파일이 없으면 컴포넌트가 비디오를 숨긴 채 두어 목업에 구워진 화면이 보임.
      hoverVideo: "/media/intro/s1-card1-hover.mp4",
    },
    {
      key: "influencer" as const,
      // 1708x3778 원본은 4.8MB 라 보이는 위쪽(y 0-1560)만 남기고 폭 820px 로 줄임.
      // 자르는 높이를 바꾸면 section1-card-classes 의 카드 2 높이 값도 함께 바꿔야 함.
      image: S1_CARD2,
      hoverImage: S1_MOCKUP,
      // 호버하면 폰 화면 안에서 스크롤되는 전체 캡처(727x4096).
      screenImg: S1_CARD2_SCREEN,
      // 스크롤되는 캡처 위에 고정되는 상태바 + 앱 헤더.
      screenHead: S1_CARD2_SCREEN_HEAD,
    },
    {
      key: "buyer" as const,
      // 카드 2와 같은 크롭. 목업의 화면은 구워진 비트맵이라, 카드 3의 캡처와 헤더를 화면 사각형
      // (원본 좌표 x 428-1328, y 198-3430) 위에 합성하고 외곽은 건드리지 않음. 목업이 바뀌면 같은 방식으로 다시 함.
      image: S1_CARD3,
      hoverImage: S1_MOCKUP,
      // 캡처가 구매자 플랫폼이라 앱 헤더가 카드 2와 다름. 디자인 툴의 4096px 내보내기 상한 때문에 380x4096 이며,
      // 245px 폭으로 그려지므로 문제없음. 높이를 바꾸면 section1-card-classes 의 카드 3 스크롤 거리(PC/TAB)도 바꿔야 함.
      screenImg: S1_CARD3_SCREEN,
      screenHead: S1_CARD3_SCREEN_HEAD,
    },
  ],
};

export const section2 = {
  // 수상 배지는 SVG 한 장으로 내보냄: 월계관 벡터와 30% 불투명도 글자가 절대 좌표로 얽혀 있고,
  // PNG 로 내보내면 상위 프레임의 어두운 배경 사각형이 함께 구워짐.
  awards: S2_AWARDS,
  // 문구는 번역 키 `section2.*`(파트너 설명은 `section2.partners.{key}`).
  partners: [
    {
      key: "samsung",
      // 삼성은 로고가 둘('Fit My Marketing' + 삼성전자)이라 좌표를 따로 정함.
      logos: [S2_SAMSUNG_FMM, S2_SAMSUNG],
    },
    {
      key: "aws",
      logos: [S2_AWS],
    },
    {
      key: "google",
      logos: [S2_GOOGLE],
    },
  ] satisfies {
    key: "samsung" | "aws" | "google";
    logos: string[];
  }[],
};

// 카드 이미지는 수십 개의 벡터로 이뤄져 다시 만들 수 없으므로, 화면 크기마다 카드 컨테이너를 스프라이트
// 한 장으로 내보내고 각 카드가 background-position 으로 자기 영역을 보여 줌.
export const section4 = {
  sprites: {
    pc: { src: S4_SPRITE_PC, w: 1200, h: 2192 },
    tab: { src: S4_SPRITE_TAB, w: 688, h: 1352 },
    mo: { src: S4_SPRITE_MO, w: 320, h: 2283 },
  },
  // 카드별 이미지 영역 크기와 세로 피치이며 디자인 값 그대로.
  layout: {
    pc: { imgW: 794, imgH: 400, pitch: 448, rightX: 406 }, // 반전 카드는 x=406 에서 시작
    tab: { imgW: 456, imgH: 232, pitch: 280, rightX: 232 },
    mo: { imgW: 320, imgH: 240, pitch: 459 }, // 이미지가 위에 있어 가로 오프셋 없음
  },
  // 제목·설명은 번역 키 `section4.title`, `section4.description`.
  // 제목의 "\n" 은 TAB 에서만 적용됨(컴포넌트가 그 폭에서만 pre-line 을 켬):
  // PC 는 한 줄, MO 는 폭에 맞춰 흐름. 설명의 "\n" 은 PC·TAB 에서 적용됨.
  // 카드 문구는 `section4.cards.{key}.{label|title|description}`.
  cards: [
    { key: "authentic" as const, icon: S4_ICON1, reverse: false },
    {
      key: "target" as const,
      icon: S4_ICON2,
      video: "/media/intro/s4-card2-hover.mp4",
      reverse: true,
    },
    {
      key: "evaluation" as const,
      icon: S4_ICON3,
      video: "/media/intro/s4-card3-hover.mp4",
      reverse: false,
    },
    { key: "channel" as const, icon: S4_ICON4, reverse: true },
    { key: "global" as const, icon: S4_ICON5, reverse: false },
  ],
};

// 호버하면 배경 사진만 커짐(106.1% -> 136.63%). 배지·글자·그라데이션은 그대로라 CSS transform 하나로 재현됨.
export const section5 = {
  // 문구는 번역 키 `section5.*`(항목의 `key` 는 `.title`·`.description` 앞까지의 전체 경로). 제목의 강조는 <accent> 태그로 한 키에 둠.
  // 캠페인 상품 이름(브랜드형·공구형 등)은 용어집 확정 전까지 모든 언어에서 한국어.
  columns: [
    {
      key: "brand" as const,
      badgeWeight: "bold" as const,
      card: { image: S5_CARD1 },
      items: [
        {
          key: "section5.columns.brand.items.basic" as const,
          icon: S5_ICON_BASIC,
        },
        {
          key: "section5.columns.brand.items.premium" as const,
          icon: S5_ICON_PREMIUM,
        },
      ],
    },
    {
      key: "groupBuy" as const,
      badgeWeight: "semibold" as const,
      card: { image: S5_CARD2 },
      items: [
        {
          key: "section5.columns.groupBuy.items.openMarket" as const,
          icon: S5_ICON_OPENMARKET,
        },
        {
          key: "section5.columns.groupBuy.items.performance" as const,
          icon: S5_ICON_PERFORMANCE,
        },
        {
          key: "section5.columns.groupBuy.items.liveCommerce" as const,
          icon: S5_ICON_LIVE,
        },
      ],
    },
  ],
};

// 카드 이미지 8장은 복잡한 벡터·이미지 합성이라 1200x1002 카드 컨테이너를 2x 스프라이트 한 장으로 내보내고
// 각 카드가 자기 영역을 잘라 씀.
export const section6 = {
  sprite: S6_SPRITE,
  spriteSize: { w: 1200, h: 1002 },
  // TAB·MO 는 카드 이미지를 재배치해 PC 스프라이트를 쓸 수 없어 그룹마다 세로 스프라이트 한 장씩을 씀.
  // 내보낸 폭은 334 였지만 아트워크는 320 뿐이라 7px 흰 여백이 남아, 더 넓은 TAB 카드에서 띠로 보임.
  // 여백을 잘라 내고 TAB 디자인(카드 이미지 334x236)에 맞게 아트워크를 334 로 키웠고(1.04375배) y 좌표도 같은 비율로 키움.
  // MO(320)는 가운데 320 을 보여 줌.
  spriteMo: [
    { src: S6_SPRITE_MO1, w: 334, h: 1666.9, ys: [55.3, 433.2, 844.4, 1255.6] },
    { src: S6_SPRITE_MO2, w: 334, h: 1700.3, ys: [55.3, 466.6, 877.8, 1288.9] },
  ],
  card: { w: 285, h: 236 },
  // 문구는 번역 키 `section6.*`(카드의 `key` 는 `.title`·`.description` 앞까지의 전체 경로). 제목의 강조는 <accent> 태그로 한 키에 둠.
  groups: [
    {
      // PC 디자인은 두 그룹 모두 "공구형 캠페인 사례"로 적었지만 MO 는 "브랜드형".
      // 카드 내용(갤럭시 탭 출시 -> 의견 분석 -> 인사이트 -> 매칭)이 브랜드형이므로 MO 가 맞는 것으로 봄.
      key: "brand" as const,
      spriteY: 66, // 1x 스프라이트에서 이 그룹의 카드 이미지 y
      cards: [
        { no: "01", key: "section6.groups.brand.cards.request" as const },
        { no: "02", key: "section6.groups.brand.cards.opinion" as const },
        { no: "03", key: "section6.groups.brand.cards.insight" as const },
        { no: "04", key: "section6.groups.brand.cards.matching" as const },
      ],
    },
    {
      key: "groupBuy" as const,
      spriteY: 592,
      cards: [
        { no: "01", key: "section6.groups.groupBuy.cards.collect" as const },
        { no: "02", key: "section6.groups.groupBuy.cards.select" as const },
        { no: "03", key: "section6.groups.groupBuy.cards.explore" as const },
        { no: "04", key: "section6.groups.groupBuy.cards.purchase" as const },
      ],
    },
  ],
};

/**
 * 섹션 6과 문의 폼 사이의 CTA 띠(높이는 모든 화면에서 433px).
 *
 * 배경 이미지에 디자인의 회전과 color-burn 블렌드가 이미 구워져 있어, CSS 로 블렌드를 다시 만들지 않고 그대로 깖.
 * 버튼은 히어로의 것과 같은 컴포넌트 인스턴스.
 */
export const banner = {
  bg: BANNER_BG,
  // 문구는 번역 키 `banner.*`.
  buttons: hero.buttons,
};

/**
 * 소개 문의 폼. 회사명만 선택 항목.
 * PC·TAB 은 2열로 배치하고 문의 내용은 항상 한 행을 다 차지하며, MO 는 1열.
 */
export interface ContactField {
  /** 번역 키 `contact.fields.{key}.{label|placeholder}` 를 고르는 값이기도 함. */
  key: "name" | "company" | "email" | "phone" | "message";
  required: boolean;
  type?: string;
  pattern?: string;
  /** 패턴 불일치 말풍선에 덧붙일 설명의 번역 키. */
  titleKey?: "contact.fields.phone.title";
  multiline?: boolean;
}

export const contact = {
  logo: CONTACT_LOGO,
  fields: [
    { key: "name", required: true },
    { key: "company", required: false },
    { key: "email", required: true, type: "email" },
    // 플레이스홀더가 입력 규칙을 겸함. `pattern` 이 같은 규칙을 브라우저 기본 검증으로 강제함.
    // 전화번호의 `title`(Chrome 이 패턴 불일치 말풍선에 덧붙임)은 `titleKey` 의 번역 키.
    {
      key: "phone",
      required: true,
      type: "tel",
      pattern: "[0-9]{9,11}",
      titleKey: "contact.fields.phone.title",
    },
    { key: "message", required: true, multiline: true },
  ] satisfies ContactField[],
};

// 예전 라우터는 이 경로 이름이 페이지 제목과 어긋남:
// "/service" 가 이용약관, "/term" 이 개인정보 처리방침.
export const footer = {
  logo: FOOTER_LOGO,
  links: [
    { key: "terms", href: TERMS_OF_SERVICE_HREF },
    { key: "privacy", href: PRIVACY_POLICY_HREF },
  ] as const,
  // 회사 정보(대표·사업자번호·통신판매업·주소)는 시안 원문 그대로 모든 언어에서 한국어이며
  // 번역 키 `footer.company.{line}`(2칸 공백 포함).
  companyLines: ["line1", "line2"] as const,
  copyright: "Copyright ⓒ 2026 Biglink AI all rights reserved.",
};
