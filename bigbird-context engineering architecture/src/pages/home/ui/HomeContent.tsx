import { InfluencerSearchForm } from "@/features/search-influencer";
import heroBackground from "@/shared/assets/img/home/hero-bg.jpg";
import { useTranslation } from "@/shared/i18n";

import { FeatureCards } from "./FeatureCards";
import { HeroAvatars } from "./HeroAvatars";

// 홈 본문. 키보드가 떠 있는 동안(셸의 data-keyboard="open", 태블릿·모바일)은 카드 묶음을 입력창 위로 올리고,
// 히어로·카드·입력창을 키보드 전과 같은 간격 그대로 한 묶음으로 아래에 붙임(입력창 아래 여백은 컨테이너 py-4 = 16px).
// 묶음의 첫 요소(히어로)에 mt-auto를 줌. justify-end는 넘칠 때 위쪽이 잘리고, 입력 영역에 mt-auto를 주면 히어로만 위에 남아 사이가 벌어짐.
// 입력 영역은 키보드가 열릴 때 셸이 한 번 스크롤해 버튼 줄까지 보이게 함(data-keyboard-anchor). 규칙은 .claude/skills/mobile-keyboard/SKILL.md.
// 순서는 CSS(order)로만 바꿈. DOM을 옮기면 textarea가 다시 마운트되어 포커스와 한글 조합이 끊김.
export function HomeContent() {
  const { t } = useTranslation("pages/home");

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center gap-8 px-4 py-4 tablet:gap-10 tablet:px-10 desktop:gap-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(116.9deg,var(--color-white)_3.5%,var(--color-blue-100)_33.9%,var(--color-blue-50)_75.1%,var(--color-blue-200)_100%)] tablet:bg-linear-to-l tablet:from-background tablet:to-blue-100"
      >
        <img
          src={heroBackground}
          alt=""
          className="hidden size-full object-cover opacity-30 tablet:block"
        />
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
      <section
        // 키보드가 열릴 때 셸이 이 영역(입력창과 버튼 줄)의 아래 끝을 키보드 위 16px에 보이게 스크롤함.
        data-keyboard-anchor
        className="relative flex w-full max-w-158 scroll-mb-4 flex-col gap-4 tablet:gap-5 desktop:max-w-174.5"
      >
        <InfluencerSearchForm />
        <FeatureCards className="in-data-[keyboard=open]:order-first" />
      </section>
    </div>
  );
}
