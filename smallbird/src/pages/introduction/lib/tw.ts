// 여러 랜딩 컴포넌트가 함께 쓰는 클래스 묶음. Tailwind 에는 범위 한정이 없어 반복되는 유틸리티 문자열을 여기 둠.

/**
 * PC 에서는 콘텐츠를 1200px 로 가운데 정렬하고, TAB·MO 는 좌우 패딩만 줌.
 * max-width 1240px 은 콘텐츠 1200px 에 양쪽 패딩 20px 을 더한 값
 * (preflight 의 border-box 라 패딩이 콘텐츠를 줄이지 않음).
 */
export const CONTAINER =
  "mx-auto w-full max-w-[1240px] px-5 max-introtab:px-10 max-mo:px-5";

/**
 * 스크롤 reveal 스타일. `createReveal` 이 요소를 찾아 `data-revealed` 를 붙일 수 있도록
 * `data-reveal` 속성과 함께 씀.
 *
 * Tailwind v4 의 translate-y-* 는 `transform` 이 아니라 CSS `translate` 속성을 쓰므로
 * transition 이 `translate` 를 대상으로 해야 하며, 아니면 위치가 튐.
 * 1.1s / 32px 은 디자인 요청("더 느리게"). 시간만 늘리면 느린 것이 아니라 멈춘 것처럼 보여서
 * 이동 거리도 함께 늘림.
 */
export const REVEAL =
  "translate-y-8 opacity-0 transition-[opacity,translate] duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] data-[revealed]:translate-y-0 data-[revealed]:opacity-100";
