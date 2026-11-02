import { useState } from "react";

import { useMediaQuery } from "./useMediaQuery";
import { useVisualViewport } from "./useVisualViewport";

// 보이는 영역이 키보드가 없을 때의 높이보다 이만큼 줄면 가상 키보드가 열린 것으로 봄(주소창 접힘 등 작은 변화를 거르는 경험값).
const KEYBOARD_MIN_HEIGHT = 150;

/**
 * 가상 키보드가 떠 있는지. 웹에는 표준 이벤트가 없어 "입력 포커스 + 터치 기기 + 데스크톱(1440) 미만 +
 * 보이는 영역(visualViewport) 축소"를 모두 만족할 때만 열림으로 봄. 하드웨어 키보드는 화면이 줄지 않아 해당하지 않음.
 * `isFocused`는 사용처가 입력 영역의 포커스를 넘김.
 *
 * 기준 높이는 포커스가 없을 때의 `innerHeight`. 키보드가 뜰 때 레이아웃 높이(`innerHeight`)까지 함께 줄어드는
 * 환경(일부 Android 브라우저·웹뷰)에서도 키보드를 감지하려면 현재 `innerHeight`가 아니라 키보드 전의 값과 비교해야 함.
 */
export function useVirtualKeyboardOpen(isFocused: boolean) {
  const isTouch = useMediaQuery("(pointer: coarse)");
  const isBelowDesktop = useMediaQuery("(max-width: 1439px)");
  const viewport = useVisualViewport();
  const [baseline, setBaseline] = useState(() => window.innerHeight);

  // 포커스가 없는 동안에는 기준 높이를 현재 레이아웃 높이로 맞춤(회전·주소창 변화 반영).
  if (!isFocused && baseline !== window.innerHeight) {
    setBaseline(window.innerHeight);
  }

  if (!isFocused || !isTouch || !isBelowDesktop || !viewport) return false;
  return (
    Math.max(baseline, window.innerHeight) - viewport.height >=
    KEYBOARD_MIN_HEIGHT
  );
}
