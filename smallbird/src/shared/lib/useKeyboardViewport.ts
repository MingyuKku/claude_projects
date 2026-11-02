import { useVisualViewport } from "./useVisualViewport";

export interface KeyboardViewport {
  /** 보이는 영역 높이(`visualViewport.height`). 화면을 이 높이로 줄임. */
  height: number;
  /** 브라우저가 입력을 보이려고 보이는 영역을 내린 만큼(`visualViewport.offsetTop`, 0~gap으로 제한). 화면을 이만큼 따라 내림. */
  pan: number;
  /** 레이아웃 높이에서 보이는 영역을 뺀 값. 키보드가 레이아웃을 줄이지 않고 덮은 높이. */
  gap: number;
}

/**
 * 키보드가 레이아웃을 줄이지 않고 덮는 환경(iOS Safari)에서 화면을 맞출 보이는 영역. 그 밖에는 null.
 * Android는 index.html의 `interactive-widget=resizes-content`로 레이아웃이 함께 줄어 gap이 0이므로 해당하지 않음.
 * UA가 아니라 "레이아웃 높이 − 보이는 영역 높이"로 판단함(기능 감지, mobile-keyboard skill).
 *
 * 챗지피티 웹(chatgpt.com, 2026-10 배포 번들)과 같은 방식: 입력 중·확대 배율 1일 때만 켜고,
 * offsetTop을 0~gap으로 제한해 iOS 26에서 키보드를 여닫은 뒤 offsetTop이 어긋나는 문제(WebKit 297779)를 막음.
 */
export function useKeyboardViewport(
  isKeyboardOpen: boolean,
): KeyboardViewport | null {
  // 키보드가 열린 동안만 맞추므로 그때만 구독함.
  const viewport = useVisualViewport(isKeyboardOpen);

  if (!isKeyboardOpen || !viewport || viewport.scale !== 1) return null;
  const gap = Math.max(0, viewport.layoutHeight - viewport.height);
  // 1px 이하는 소수점 반올림 차이.
  if (gap <= 1) return null;
  return {
    height: viewport.height,
    pan: Math.min(Math.max(viewport.offsetTop, 0), gap),
    gap,
  };
}
