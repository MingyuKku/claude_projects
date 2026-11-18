import { useLayoutEffect, useRef, useState } from "react";

import { KEYBOARD_STATE_ATTRIBUTE } from "@/shared/config";
import { useKeyboardViewport } from "@/shared/lib/useKeyboardViewport";
import { usePreventViewportPan } from "@/shared/lib/usePreventViewportPan";
import { useVirtualKeyboardOpen } from "@/shared/lib/useVirtualKeyboardOpen";

import { isTextEntry } from "../lib/isTextEntry";

import type { KeyboardViewport } from "@/shared/lib/useKeyboardViewport";
import type { CSSProperties, FocusEvent } from "react";

// iOS Safari는 키보드가 떠도 레이아웃을 줄이지 않아(WebKit 230225) 셸이 키보드 뒤까지 이어지고, 입력을 보이려고 화면을 내림.
// 셸을 보이는 영역의 높이로 줄이고 내린 만큼(pan) 따라 내려 Android(resizes-content)와 같은 모습으로 맞춤.
// transform은 고정 위치(fixed) 자식의 기준을 바꾸므로 relative + top으로 옮김.
function toViewportStyle(viewport: KeyboardViewport): CSSProperties {
  return {
    position: "relative",
    top: viewport.pan,
    height: viewport.height,
  };
}

// 셸 바로 아래(키보드 뒤)를 칠함. 셸이 보이는 영역을 따라가기 전 한두 프레임이나 막지 못한 끌기로 그 영역이 드러나도
// 흰 문서 배경 대신 페이지 배경이 보이게 함. 챗지피티 웹의 keyboardGapPaint와 같은 방식(높이 max(6rem, gap − pan)).
function toGapPaintStyle(viewport: KeyboardViewport): CSSProperties {
  return {
    position: "absolute",
    insetInline: 0,
    top: viewport.pan + viewport.height,
    height: `max(6rem, ${viewport.gap - viewport.pan}px)`,
    pointerEvents: "none",
  };
}

type AlignStage = "closed" | "open" | "fitted";

// 입력 영역을 키보드 위로 맞추는 시점을 정하는 단계. 키보드가 열림(open) → iOS는 셸을 보이는 영역에 맞춤(fitted).
function getAlignStage(
  isKeyboardOpen: boolean,
  isFittedToViewport: boolean,
): AlignStage {
  if (isFittedToViewport) return "fitted";
  return isKeyboardOpen ? "open" : "closed";
}

/**
 * 셸 루트에 펼칠 키보드 대응 속성(rootProps), 셸을 보이는 영역에 맞춘 동안 셸 아래를 칠할 스타일(gapPaintStyle)과
 * 맞춘 상태인지(isFittedToViewport)를 돌려줌.
 * 키보드 대응을 쓰지 않으면 rootProps는 빈 객체.
 */
export function useKeyboardAwareShell(isKeyboardAware: boolean) {
  const [isEditingText, setIsEditingText] = useState(false);
  const isKeyboardOpen = useVirtualKeyboardOpen({
    isEnabled: isKeyboardAware,
    isFocused: isEditingText,
  });
  const keyboardViewport = useKeyboardViewport(isKeyboardOpen);
  const isFittedToViewport = keyboardViewport !== null;
  // 셸을 맞춘 동안에는 바깥(키보드 뒤 영역)을 터치로 끌지 못하게 함.
  usePreventViewportPan(isFittedToViewport);

  // 키보드가 열리는 순간 한 번만, 포커스한 입력을 감싼 `[data-keyboard-anchor]`(없으면 입력 자신)의 아래 끝이 보이게 스크롤함.
  // iOS는 포커스한 입력(커서)까지만 보이게 스크롤해 그 아래 버튼 줄이 키보드에 가려지기 때문. 여백은 앵커의
  // scroll-margin-bottom(CSSOM View scrollIntoView)이나 앵커 안쪽 아래 패딩을 따름. iOS는 셸이 보이는 영역 높이로 줄어든 직후에 한 번 더 맞춤.
  // 열려 있는 동안 다시 맞추지는 않음(사용자 스크롤과 충돌). 핀치 확대로 맞춤이 풀릴 때도 맞추지 않음.
  const alignStage = getAlignStage(isKeyboardOpen, isFittedToViewport);
  const previousAlignStageRef = useRef(alignStage);

  useLayoutEffect(() => {
    const previous = previousAlignStageRef.current;
    previousAlignStageRef.current = alignStage;
    if (alignStage === previous || alignStage === "closed") return;
    if (previous === "fitted") return;
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) return;
    const anchor = active.closest("[data-keyboard-anchor]") ?? active;
    const frame = requestAnimationFrame(() =>
      anchor.scrollIntoView({ block: "end" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [alignStage]);

  const keyboardState = isKeyboardOpen ? "open" : "closed";

  function handleFocusTextEntry(event: FocusEvent<HTMLDivElement>) {
    setIsEditingText(isTextEntry(event.target));
  }

  function handleBlurTextEntry(event: FocusEvent<HTMLDivElement>) {
    if (!isTextEntry(event.relatedTarget)) setIsEditingText(false);
  }

  if (!isKeyboardAware) {
    return {
      rootProps: {},
      gapPaintStyle: undefined,
      isFittedToViewport: false,
    };
  }

  return {
    rootProps: {
      [KEYBOARD_STATE_ATTRIBUTE]: keyboardState,
      style: keyboardViewport ? toViewportStyle(keyboardViewport) : undefined,
      onFocus: handleFocusTextEntry,
      onBlur: handleBlurTextEntry,
    },
    gapPaintStyle: keyboardViewport
      ? toGapPaintStyle(keyboardViewport)
      : undefined,
    isFittedToViewport,
  };
}
