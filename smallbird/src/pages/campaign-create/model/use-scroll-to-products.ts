import { useEffect, useRef } from "react";

/**
 * 서비스를 직접 골랐을 때 상품 섹션 제목이 화면 밖이면 제목이 맨 위에 오도록 내림. 모바일은 서비스 카드가 세로로 쌓여 상품 섹션이
 * 화면 밖에 있기 때문. 제목이 이미 화면 안에 있으면 움직이지 않아 서비스를 바꿔 누를 때 화면이 다시 조금씩 움직이지 않음.
 * `?service=`가 이미 있는 채로 열린 경우(새로고침·뒤로가기 복원)에도 내리지 않음. 모션 줄이기 설정이면 부드럽게 움직이지 않고 바로 이동함.
 */
export function useScrollToProducts(selectedService: string | null) {
  const sectionRef = useRef<HTMLElement>(null);
  const isRequestedRef = useRef(false);

  useEffect(() => {
    if (!isRequestedRef.current) return;
    isRequestedRef.current = false;
    const section = sectionRef.current;
    if (!section) return;
    const heading = section.firstElementChild ?? section;
    const { top, bottom } = heading.getBoundingClientRect();
    if (top >= 0 && bottom <= window.innerHeight) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    section.scrollIntoView?.({
      block: "start",
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [selectedService]);

  return {
    sectionRef,
    /** 사용자가 서비스를 고른 직후에 부름. 다음 렌더에서 한 번만 내림. */
    requestScroll: () => {
      isRequestedRef.current = true;
    },
  };
}
