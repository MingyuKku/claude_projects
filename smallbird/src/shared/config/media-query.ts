// 화면 구간·입력 방식 미디어 쿼리. 구간 경계는 Tailwind 브레이크포인트(src/app/styles/index.css의 tablet 768, desktop 1440)와 같은 값.
// 상한은 .98px로 씀. 767px로 쓰면 브라우저 확대 등으로 폭이 767.5px 같은 소수일 때 어느 구간에도 맞지 않는 틈이 생김.
export const MEDIA_QUERY = {
  /** 모바일(768 미만). */
  mobile: "(max-width: 767.98px)",
  /** 태블릿 이상(768 이상). */
  tabletUp: "(min-width: 768px)",
  /** 데스크톱 미만(1440 미만). */
  belowDesktop: "(max-width: 1439.98px)",
  /** 데스크톱(1440 이상). */
  desktop: "(min-width: 1440px)",
  /** 주 입력이 손가락(터치 기기). */
  touch: "(pointer: coarse)",
  /** 모션 줄이기를 켬. */
  reducedMotion: "(prefers-reduced-motion: reduce)",
} as const;
