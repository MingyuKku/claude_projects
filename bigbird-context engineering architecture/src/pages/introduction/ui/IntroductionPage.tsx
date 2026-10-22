import { useIntroScroll } from "../lib/use-intro-scroll";
import { IntroBanner } from "./IntroBanner";
import { IntroContact } from "./IntroContact";
import { IntroFooter } from "./IntroFooter";
import { IntroHeader } from "./IntroHeader";
import { IntroHero } from "./IntroHero";
import { IntroSection1 } from "./IntroSection1";
import { IntroSection2 } from "./IntroSection2";
import { IntroSection3 } from "./IntroSection3";
import { IntroSection4 } from "./IntroSection4";
import { IntroSection5 } from "./IntroSection5";
import { IntroSection6 } from "./IntroSection6";
import { IntroSeo } from "./IntroSeo";

export function IntroductionPage() {
  const { scrollerRef, heroProgress, handleScroll } = useIntroScroll();

  return (
    // h-dvh: 예전 SCSS 는 100vh 폴백을 겹쳐 썼지만 Tailwind 는 같은 속성의 두 선언 순서를 보장하지 않음.
    // dvh 가 없는 것은 Safari 15.3 이하뿐.
    <div
      className="h-dvh overflow-x-hidden overflow-y-auto"
      ref={scrollerRef}
      onScroll={handleScroll}
    >
      <IntroSeo />
      <IntroHeader progress={heroProgress} />
      <IntroHero progress={heroProgress} />
      <IntroSection1 />
      <IntroSection2 />
      <IntroSection3 />
      <IntroSection4 />
      <IntroSection5 />
      <IntroSection6 />
      <IntroBanner />
      <IntroContact />
      <IntroFooter />
    </div>
  );
}
