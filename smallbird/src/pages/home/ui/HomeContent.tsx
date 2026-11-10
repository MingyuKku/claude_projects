import { InfluencerSearchForm } from "@/features/search-influencer";
import heroBackground from "@/shared/assets/img/home/hero-bg.jpg";
import { WavyBackground } from "@/shared/components/wavy-background";
import { useTranslation } from "@/shared/i18n";

import { FeatureCards } from "./FeatureCards";
import { HeroAvatars } from "./HeroAvatars";

import type { SessionViewModel } from "@/entities/session";

interface HomeContentProps {
  /** 셸과 같은 세션 확인 결과. 카드의 로그인 안내 여부에 씀. */
  session: Promise<SessionViewModel>;
}

// 키보드가 열린 동안 입력창은 본문 아래 끝(아래 여백 --keyboard-anchor-gap 위)에 고정되고 그 뒤로 본문만 스크롤됨(디자인 QA 2026-11-02).
// 여백은 셸이 본문 아래를 흐리는 길이와 같은 변수를 써서 고정된 입력창이 흐려지지 않게 함.
// sticky는 부모 영역 안에서만 붙으므로 입력창은 본문 전체(이 컨테이너)의 직속 자식이어야 함. 묶음 안에 두면 묶음이 스크롤로 빠질 때 같이 사라짐.
// 쌓임 순서를 카드보다 위로 두어 스크롤되는 카드가 입력창 위로 그려지지 않게 함.
// 카드는 relative로 둠. 위치 지정이 없으면 absolute인 배경보다 아래에 그려져 가려짐.
const SEARCH_FORM_CLASS_NAME =
  "mt-6 w-full max-w-158 desktop:max-w-174.5 in-data-[keyboard=open]:sticky in-data-[keyboard=open]:bottom-(--keyboard-anchor-gap) in-data-[keyboard=open]:z-10 in-data-[keyboard=open]:order-2 in-data-[keyboard=open]:mt-4 tablet:in-data-[keyboard=open]:mt-5";
const FEATURE_CARDS_CLASS_NAME =
  "relative mt-4 max-w-158 tablet:mt-5 desktop:max-w-174.5 in-data-[keyboard=open]:order-1 in-data-[keyboard=open]:mt-6 tablet:in-data-[keyboard=open]:mt-6";

// 홈 본문. 키보드가 떠 있는 동안(셸의 data-keyboard="open", 태블릿·모바일)은 카드를 입력창 위로 올리고,
// 히어로·카드·입력창을 키보드 전과 같은 간격 그대로 아래에 붙임(입력창 아래 여백은 컨테이너 아래 패딩 --keyboard-anchor-gap).
// 첫 요소(히어로)에 mt-auto를 줌. justify-end는 넘칠 때 위쪽이 잘리고, 입력창에 mt-auto를 주면 히어로만 위에 남아 사이가 벌어짐.
// 간격은 순서가 바뀌므로 gap 대신 요소별 위 여백으로 줌: 히어로 → 입력창 24px, 입력창 → 카드 16px(태블릿 20px). 키보드가 열리면 히어로 → 카드 24px, 카드 → 입력창 16px(태블릿 20px).
// 키보드가 열릴 때 셸이 이 컨테이너의 아래 끝(입력창과 버튼 줄, 그 아래 여백 포함)이 보이게 한 번 스크롤함(data-keyboard-anchor).
// 입력창이 sticky라 입력창 자신을 앵커로 두면 붙어 있는 위치 기준으로 계산되어 본문이 끝까지 스크롤되지 않음. 규칙은 .claude/skills/mobile-keyboard/SKILL.md.
// 순서는 CSS(order)로만 바꿈. DOM을 옮기면 textarea가 다시 마운트되어 포커스와 한글 조합이 끊김.
export function HomeContent({ session }: HomeContentProps) {
  const { t } = useTranslation("pages/home");

  return (
    <div
      // 펼친 검색창이 이 영역의 안쪽 위까지 덮으므로 위 패딩이 곧 펼친 입력창의 위쪽 여백임(시안: PC 48·태블릿 40·모바일 16). features/search-influencer.
      data-search-expand-boundary
      data-keyboard-anchor
      className="relative flex min-h-full flex-col items-center justify-center px-4 py-4 in-data-[keyboard=open]:pb-(--keyboard-anchor-gap) tablet:px-10 tablet:py-10 tablet:in-data-[keyboard=open]:pb-(--keyboard-anchor-gap) desktop:py-12"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(116.9deg,var(--color-white)_3.5%,var(--color-blue-100)_33.9%,var(--color-blue-50)_75.1%,var(--color-blue-200)_100%)] tablet:bg-linear-to-l tablet:from-background tablet:to-blue-100"
      >
        <img
          src={heroBackground}
          alt=""
          className="hidden size-full object-cover opacity-30 tablet:block"
        />
        <WavyBackground />
      </div>
      <section className="relative flex w-full max-w-158 flex-col items-center gap-5 in-data-[keyboard=open]:mt-auto desktop:max-w-174.5">
        <HeroAvatars className="hidden tablet:block" />
        <h2 className="text-center typo-h2 leading-7.5 whitespace-pre-line text-foreground tablet:leading-9 ko:break-keep">
          {t("hero.title")}
        </h2>
        <p className="hidden text-center text-lg leading-7 font-medium text-muted-foreground tablet:block">
          {t("hero.subtitle")}
        </p>
      </section>
      <InfluencerSearchForm className={SEARCH_FORM_CLASS_NAME} />
      <FeatureCards session={session} className={FEATURE_CARDS_CLASS_NAME} />
    </div>
  );
}
