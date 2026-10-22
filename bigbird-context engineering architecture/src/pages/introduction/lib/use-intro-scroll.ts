import { useEffect, useRef, useState } from "react";

import { HERO_SHRINK_DISTANCE } from "../model/constants";
import { calcHeroProgress } from "./hero-progress";
import { createReveal, type Reveal } from "./reveal";

/**
 * 소개 페이지 스크롤 컨테이너의 스크롤을 처리함. 히어로 축소 진행도(0~1)를 계산하고,
 * 스크롤 위치에 맞춰 각 블록을 떠오르게 함.
 */
export function useIntroScroll() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<Reveal | null>(null);
  // rAF 예약 id. 렌더에 영향이 없어 state 로 두지 않음. null 이면 예약된 프레임이 없음.
  const frameRef = useRef<number | null>(null);
  const [heroProgress, setHeroProgress] = useState(0);

  useEffect(() => {
    // 자식 섹션이 모두 렌더된 뒤에 훑어야 대상을 놓치지 않음.
    revealRef.current = createReveal(scrollerRef.current);
    // 첫 화면 안에 이미 들어와 있는 블록.
    revealRef.current.check();

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, []);

  function handleScroll() {
    // 스크롤 이벤트마다 리렌더되지 않도록 rAF 로 간격을 둠.
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      const element = scrollerRef.current;
      setHeroProgress(
        calcHeroProgress(element ? element.scrollTop : 0, HERO_SHRINK_DISTANCE),
      );
      revealRef.current?.check();
      frameRef.current = null;
    });
  }

  return { scrollerRef, heroProgress, handleScroll };
}
