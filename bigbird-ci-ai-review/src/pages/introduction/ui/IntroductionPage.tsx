import { useEffect, useRef, useState } from "react";

import { calcHeroProgress } from "../lib/hero-progress";
import { createReveal, type Reveal } from "../lib/reveal";
import { HERO_SHRINK_DISTANCE } from "../model/constants";
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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<Reveal | null>(null);
  // rAF throttle flag; it does not affect rendering, so it is not state.
  const isTickingRef = useRef(false);
  const [heroProgress, setHeroProgress] = useState(0);

  useEffect(() => {
    // Scan only after every child section has rendered, or targets are missed.
    revealRef.current = createReveal(scrollerRef.current);
    // Blocks already inside the first screen.
    revealRef.current.check();
  }, []);

  function handleScroll() {
    // Throttled by rAF so scroll events do not each cause a re-render.
    if (isTickingRef.current) return;
    isTickingRef.current = true;
    window.requestAnimationFrame(() => {
      const element = scrollerRef.current;
      setHeroProgress(
        calcHeroProgress(element ? element.scrollTop : 0, HERO_SHRINK_DISTANCE),
      );
      revealRef.current?.check();
      isTickingRef.current = false;
    });
  }

  return (
    // h-dvh: the old SCSS stacked a 100vh fallback, but Tailwind does not
    // guarantee the order of two declarations of one property. Only Safari
    // 15.3 and older lack dvh.
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
