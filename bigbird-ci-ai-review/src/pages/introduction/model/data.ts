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

// All landing copy and image paths live here; a mockup change should only touch
// this file. Videos and the PDF are absolute paths because they sit in public/.
// Hero max inset/radius are not here on purpose: they are responsive, so the
// Tailwind classes in IntroHero own them and breakpoints stay in one place.

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface IntroButton {
  label: string;
  href: string;
  variant: ButtonVariant;
  download?: string;
  icon?: string;
}

/**
 * Hero copy and assets.
 *
 * The brochure button downloads the PDF directly. It is same-origin (public/),
 * so the `download` attribute works instead of opening a new tab.
 * `poster` is the first frame of `video`: it is the fallback before load or when
 * playback fails, so re-extract it whenever the video is replaced.
 * There is no sub copy on purpose: the design has none, and none is invented.
 */
export const hero = {
  video: "/media/intro/hero.mp4",
  poster: HERO_POSTER,
  // Line breaks differ per screen: PC/TAB show 2 lines (1st / 2nd+3rd), MO shows 3.
  // Leaving it to auto-wrapping would split MO as "이제 데이터로 더 / 정확하게".
  titleLines: ["인플루언서 마케팅,", "이제 데이터로", "더 정확하게 시작하세요"],
  buttons: [
    {
      label: "서비스 소개서 요청",
      href: "/media/intro/bigbird-service-intro.pdf",
      download: "빅버드 서비스 소개서.pdf",
      variant: "secondary",
    },
    {
      label: "바로 시작하기",
      href: MAIN_LOGIN_HREF,
      variant: "primary",
      icon: HERO_CTA_ARROW,
    },
  ] satisfies IntroButton[],
};

/**
 * Header (GNB) data.
 *
 * `logoLight` is a stopgap: the design has no white logo, so it is the black
 * logo with the fill turned white. Replace logo-white.svg when a real one arrives.
 */
export const header = {
  logoLight: LOGO_WHITE,
  logoDark: LOGO_BLACK,
  buttons: [
    { label: "이용 가이드", href: LEGACY_GUIDE_PATH, variant: "ghost" },
    { label: "시작하기", href: MAIN_LOGIN_HREF, variant: "primary" },
  ] satisfies IntroButton[],
};

export const section1 = {
  // The title breaks into 2 lines at the same place on all three screens.
  title: "브랜드와 인플루언서를 연결하는\n광고주 전용 마케팅 플랫폼",
  description:
    "빅버드는 광고주 상품과 캠페인 목적에 맞는 인플루언서를 매칭하고, " +
    "콘텐츠 집행부터 모니터링, 효과 분석까지 연결합니다.",
  cards: [
    {
      title: "광고주 플랫폼",
      description:
        "캠페인 의뢰, 인플루언서 선정,\n캠페인 현황, 성과 분석을 관리합니다.",
      image: S1_CARD1,
      hoverImage: S1_CARD1_HOVER,
      // Plays inside the monitor screen on hover. The screen is 491:277, so a
      // 16:9 video crops nothing. If the file is missing the component keeps the
      // video hidden and the mockup's baked-in screen shows.
      hoverVideo: "/media/intro/s1-card1-hover.mp4",
    },
    {
      title: "인플루언서 플랫폼",
      description:
        "인플루언서가 캠페인에 참여하고\n콘텐츠를 제작·등록할 수 있습니다.",
      // The 1708x3778 original is 4.8MB, so only the visible top (y 0-1560) is
      // kept, resized to 820px wide. Changing the crop height means changing the
      // card 2 height values in IntroSection1 too.
      image: S1_CARD2,
      hoverImage: S1_MOCKUP,
      // Full capture (727x4096) that scrolls inside the phone screen on hover.
      screenImg: S1_CARD2_SCREEN,
      // Status bar + app header, pinned on top of the scrolling capture.
      screenHead: S1_CARD2_SCREEN_HEAD,
    },
    {
      title: "구매자 플랫폼",
      description:
        "공동구매, 라이브커머스, 결제,\n교환·반품, 고객센터까지 연결합니다.",
      // Same crop as card 2. The mockup's screen is a baked bitmap, so the card 3
      // capture and header are composited over the screen rectangle (original
      // coords x 428-1328, y 198-3430) while the shell stays untouched. Redo it
      // the same way when the mockup changes.
      image: S1_CARD3,
      hoverImage: S1_MOCKUP,
      // The capture is the buyer platform, so its app header differs from card 2.
      // It is 380x4096 because of the design tool's 4096px export cap; it is drawn
      // 245px wide so that is fine. Changing its height means changing the card 3
      // scroll distance (PC/TAB) in IntroSection1.
      screenImg: S1_CARD3_SCREEN,
      screenHead: S1_CARD3_SCREEN_HEAD,
    },
  ],
};

export const section2 = {
  // Award badges exported as one SVG: the laurel vectors and the 30%-opacity text
  // are entangled by absolute coordinates, and a PNG export bakes in a dark
  // background rectangle from the ancestor frame.
  awards: S2_AWARDS,
  title: "주요 브랜드와 기관이 빅버드를 선택했습니다",
  description:
    "주요 브랜드 협업과 성과를 바탕으로 신뢰도 높은 인플루언서 마케팅 경험을 제공합니다.",
  partners: [
    {
      key: "samsung",
      // Samsung has two logos ('Fit My Marketing' + Samsung Electronics), so its
      // coordinates are set separately.
      logos: [S2_SAMSUNG_FMM, S2_SAMSUNG],
      description:
        "삼성전자 무선사업부 인플루언서 마케팅\n'삼성피켓' 공동사업자 선정",
    },
    {
      key: "aws",
      logos: [S2_AWS],
      description: "2020 창업 도약 패키지\n아마존 최종 선정",
    },
    {
      key: "google",
      logos: [S2_GOOGLE],
      description: "2020 창업 도약 패키지\n구글 최종 선정",
    },
  ] satisfies {
    key: "samsung" | "aws" | "google";
    logos: string[];
    description: string;
  }[],
};

export const section3 = {
  title: "다양한 브랜드가 빅버드와 함께했습니다",
  description:
    "빅버드는 브랜드 캠페인, 공동구매, 라이브커머스, 소비자 데이터 분석까지 " +
    "다양한 광고 목적에 맞춰 인플루언서 마케팅을 진행해왔습니다.",
};

// Card images are made of dozens of vectors and cannot be rebuilt, so each
// screen size exports the card container as one sprite and every card shows its
// own region through background-position.
export const section4 = {
  sprites: {
    pc: { src: S4_SPRITE_PC, w: 1200, h: 2192 },
    tab: { src: S4_SPRITE_TAB, w: 688, h: 1352 },
    mo: { src: S4_SPRITE_MO, w: 320, h: 2283 },
  },
  // Image area size and vertical pitch per card, straight from the design.
  layout: {
    pc: { imgW: 794, imgH: 400, pitch: 448, rightX: 406 }, // reversed cards start at x=406
    tab: { imgW: 456, imgH: 232, pitch: 280, rightX: 232 },
    mo: { imgW: 320, imgH: 240, pitch: 459 }, // image on top, no horizontal offset
  },
  // The "\n" only takes effect on TAB (the component enables pre-line there):
  // PC is one line and MO follows the width.
  titleParts: [
    { text: "인플루언서 마케팅에 필요한 과정을\n" },
    { text: "한곳에서 관리", accent: true },
    { text: "하세요" },
  ],
  // PC and TAB break at this point (pre-line); left to the width alone the first
  // line would run on through "광고주가 필요한 과정을". MO flows as one paragraph.
  description:
    "캠페인 목적에 맞는 인플루언서를 찾고, SNS 채널 집행부터 성과 확인까지\n" +
    "광고주가 필요한 과정을 쉽게 관리할 수 있습니다.",
  cards: [
    {
      label: "진성 인플루언서 매칭",
      title: "팔로워 수가 아닌\n진성 인플루언서를 찾습니다",
      description:
        "팔로워 수만 보는 것이 아니라, 콘텐츠 반응과 " +
        "영향력을 분석해 광고주 상품에 맞는 인플루언서를 찾을 수 있습니다",
      icon: S4_ICON1,
      reverse: false,
    },
    {
      label: "타깃 인플루언서 분석",
      title: "상품에 맞는 타깃을\n더 세분화해서 찾습니다",
      description:
        "대분류와 중분류 기반으로 인플루언서를 분석해 " +
        "광고주 상품에 적합한 타깃 인플루언서 그룹을 찾을 수 있습니다",
      icon: S4_ICON2,
      video: "/media/intro/s4-card2-hover.mp4",
      reverse: true,
    },
    {
      label: "캠페인 유형별 인플루언서 평가",
      title: "캠페인 목적에 맞는\n인플루언서를 평가합니다",
      description:
        "브랜드 인지도, 공동구매, 라이브커머스 등 캠페인 목적에 따라 " +
        "적합한 인플루언서를 평가하고 선정할 수 있습니다",
      icon: S4_ICON3,
      video: "/media/intro/s4-card3-hover.mp4",
      reverse: false,
    },
    {
      label: "SNS 채널별 캠페인 집행",
      title: "다양한 SNS 채널에서\n캠페인을 집행합니다",
      description:
        "인스타그램, 네이버 블로그, 페이스북, 유튜브, 틱톡 등 " +
        "캠페인 목적에 맞는 채널에서 마케팅을 진행할 수 있습니다",
      icon: S4_ICON4,
      reverse: true,
    },
    {
      label: "글로벌 인플루언서 플랫폼",
      title: "국내를 넘어 글로벌\n인플루언서까지 연결합니다",
      description:
        "국가별 언어 분석과 인플루언서 데이터를 기반으로 " +
        "해외 인플루언서 마케팅까지 확장할 수 있습니다",
      icon: S4_ICON5,
      reverse: false,
    },
  ],
};

// On hover only the background photo scales (106.1% -> 136.63%); the badge, text
// and gradient stay, so one CSS transform reproduces it.
export const section5 = {
  titleParts: [
    { text: "브랜드 목표에 맞는 " },
    { text: "캠페인 상품", accent: true },
    { text: "을 선택하세요" },
  ],
  description: "캠페인 목적에 따라 적합한 상품을 선택할 수 있습니다",
  columns: [
    {
      card: {
        badge: "브랜드형",
        title: "브랜드 인지도를 높이고\n자연스러운 바이럴을 만듭니다",
        description:
          "광고주 상품에 맞는 인플루언서를 매칭해\n브랜드 콘텐츠와 바이럴 이슈잉을 진행합니다",
        image: S5_CARD1,
      },
      items: [
        {
          icon: S5_ICON_BASIC,
          title: "베이직형",
          description:
            "합리적인 비용으로 다수의 인플루언서와 함께 확산형 바이럴 캠페인을 진행합니다",
        },
        {
          icon: S5_ICON_PREMIUM,
          title: "프리미엄형",
          description:
            "광고 피로도가 낮은 진성 인플루언서를 대상으로 프리미엄 브랜딩 캠페인을 진행합니다",
        },
      ],
    },
    {
      card: {
        badge: "공구형",
        title: "인플루언서 팬덤을 활용해\n구매 전환까지 연결합니다",
        description:
          "상품 구매 가능성이 높은 팔로워를 보유한 인플루언서와 공동구매,\n" +
          "오픈마켓, 라이브커머스를 진행할 수 있습니다",
        image: S5_CARD2,
      },
      items: [
        {
          icon: S5_ICON_OPENMARKET,
          title: "오픈마켓형",
          description:
            "다수의 인플루언서와 공동구매를 진행하고, 구매자 플랫폼을 통해 결제와 판매 관리를 연결합니다",
        },
        {
          icon: S5_ICON_PERFORMANCE,
          title: "퍼포먼스형",
          description:
            "구매 가능성이 높은 충성 팔로워를 보유한 인플루언서와 구매 전환 중심의 공구 캠페인을 진행합니다",
        },
        {
          icon: S5_ICON_LIVE,
          title: "라이브커머스형",
          description:
            "인플루언서 라이브 방송을 통해 상품 리뷰, 실시간 소통, 구매 전환까지 연결합니다",
        },
      ],
    },
  ],
};

// The 8 card images are complex vector/image compositions, so the 1200x1002 card
// container is exported as one 2x sprite and each card crops its own region.
export const section6 = {
  sprite: S6_SPRITE,
  spriteSize: { w: 1200, h: 1002 },
  // TAB and MO rearrange the card images, so they cannot use the PC sprite and
  // get one vertical sprite per group. The export was 334 wide but the artwork
  // only 320, leaving 7px white margins that showed as a stripe on the wider TAB
  // cards. The margins were cut and the artwork scaled to 334 (1.04375x) to match
  // the TAB design (card image 334x236); y coords scaled the same. MO (320)
  // shows the center 320.
  spriteMo: [
    { src: S6_SPRITE_MO1, w: 334, h: 1666.9, ys: [55.3, 433.2, 844.4, 1255.6] },
    { src: S6_SPRITE_MO2, w: 334, h: 1700.3, ys: [55.3, 466.6, 877.8, 1288.9] },
  ],
  card: { w: 285, h: 236 },
  titleParts: [
    { text: "실제 캠페인 사례", accent: true },
    { text: "로 빅버드 활용 방식을 확인하세요" },
  ],
  description: "상품 특성 유형에 맞는 실제 캠페인 사례를 확인하세요",
  groups: [
    {
      // The PC design labels both groups "공구형 캠페인 사례" but MO says
      // "브랜드형". The card content (Galaxy Tab launch -> opinion analysis ->
      // insight -> matching) is brand-type, so MO is treated as correct.
      heading: "브랜드형 캠페인 사례",
      spriteY: 66, // y of this group's card images in the 1x sprite
      cards: [
        {
          no: "01",
          title: "광고주 캠페인 의뢰",
          description: "갤럭시탭 S6 LITE 신제품 출시",
        },
        {
          no: "02",
          title: "제품별 빅데이터 여론 분석",
          description:
            "갤럭시탭 이전 버전 및 신제품에 대한 소비자 여론 빅데이터 분석",
        },
        {
          no: "03",
          title: "소비자 핵심 인사이트 도출",
          description:
            "갤럭시탭 제품의 주 사용자층 및 구매 가능성이 높은 소비자 유형 분석",
        },
        {
          no: "04",
          title: "타깃 인플루언서 매칭",
          description:
            "주 사용자층인 구매 가능성이 높은 소비자를 팔로워로 보유한 타깃 인플루언서 매칭",
        },
      ],
    },
    {
      heading: "공구형 캠페인 사례",
      spriteY: 592,
      cards: [
        {
          no: "01",
          title: "타겟 인플루언서 수집",
          description:
            "SNS채널별 공구 관련 해시태그 및 키워드 관련 빅데이터 수집",
        },
        {
          no: "02",
          title: "광고주별 인플루언서 선별",
          description:
            "광고주의 상품 유형에 맞는 인공 지능 기반의 최적의 인플루언서를 매칭",
        },
        {
          no: "03",
          title: "높은 충성도의 구매자 탐색",
          description:
            "두터운 팬층을 보유하고 있는 인플루언서의 마케팅을 통해 높은 판매 효율을 이끌어냄",
        },
        {
          no: "04",
          title: "공동구매 진행",
          description: "인플루언서 라이브커머스와 인플루언서 공동구매 진행",
        },
      ],
    },
  ],
};

/**
 * CTA band between section 6 and the contact form (height 433px on all screens).
 *
 * The background image already has the design's rotation and color-burn blend
 * baked in, so it is laid down as-is instead of re-creating the blend in CSS.
 * The buttons are the same component instance as the hero's.
 */
export const banner = {
  bg: BANNER_BG,
  title: "우리 브랜드에 맞는 인플루언서를 찾고 있나요?",
  description: "브랜드 목표와 상품 특성에 맞는 인플루언서를 추천드립니다",
  buttons: hero.buttons,
};

/**
 * Introduction inquiry form. Only the company name is optional.
 * PC and TAB lay it out in 2 columns, the message always spans a full row, MO is
 * a single column.
 */
export interface ContactField {
  key: string;
  label: string;
  required: boolean;
  placeholder: string;
  type?: string;
  pattern?: string;
  title?: string;
  multiline?: boolean;
}

export const contact = {
  logo: CONTACT_LOGO,
  title: "도입 문의",
  fields: [
    {
      key: "name",
      label: "이름",
      required: true,
      placeholder: "이름을 입력해주세요.",
    },
    {
      key: "company",
      label: "기업명",
      required: false,
      placeholder: "소속 기업명을 입력해주세요.",
    },
    {
      key: "email",
      label: "이메일",
      required: true,
      placeholder: "이메일을 입력해주세요.",
      type: "email",
    },
    // The placeholder doubles as the input rule; `pattern` enforces the same
    // rule through native browser validation.
    {
      key: "phone",
      label: "전화번호",
      required: true,
      placeholder: "- 없이 숫자만 입력",
      type: "tel",
      pattern: "[0-9]{9,11}",
      // Chrome appends the title to the pattern-mismatch bubble.
      title: "- 없이 숫자만 9~11자리로 입력해 주세요.",
    },
    {
      key: "message",
      label: "문의내용",
      required: true,
      placeholder: "문의하실 내용을 입력해주세요.",
      multiline: true,
    },
  ] satisfies ContactField[],
  agreeLabel:
    "[필수] 요청하신 문의 내용에 대한 응대를 위해 필요한 최소한의 개인정보 제공에 동의합니다.",
  submitLabel: "문의하기",
};

// The old router named these routes inconsistently with their page titles:
// "/service" was the terms of service and "/term" the privacy policy.
export const footer = {
  logo: FOOTER_LOGO,
  links: [
    { label: "이용약관", href: TERMS_OF_SERVICE_HREF },
    { label: "개인정보처리방침", href: PRIVACY_POLICY_HREF },
  ],
  // Verbatim from the design, including the two spaces before '대표'.
  companyLines: [
    "(주)빅링크에이아이 |  대표 : 김시영 | 사업자등록번호 : 721-86-03336 | 통신판매업 신고 : 2025-서울강남-01564호",
    "고객센터 : info@biglinkai.com / 1661-6213 | 주소 서울특별시 강남구 강남대로 310, 2012호(역삼동, 유니온센터빌딩)",
  ],
  copyright: "Copyright ⓒ 2026 Biglink AI all rights reserved.",
};
