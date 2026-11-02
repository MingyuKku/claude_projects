import { useLayoutEffect, useRef } from "react";

import {
  findHeightTargets,
  measureHeights,
  readCapturedHeights,
} from "../lib/expand-heights";
import {
  COLLAPSE_TRANSITION_DURATION,
  COLLAPSE_TRANSITION_EASING,
  EXPAND_TRANSITION_DURATION,
  EXPAND_TRANSITION_EASING,
  EXPAND_TRANSITION_LEAD,
} from "./constants";

import type { ExpandPhase } from "./useInlineExpand";
import type { RefObject } from "react";

interface UseExpandTransitionOptions {
  formRef: RefObject<HTMLFormElement | null>;
  phase: ExpandPhase;
  /** 접는 전환이 모두 끝났을 때. */
  onCollapsed: () => void;
}

const HEIGHT_TARGET_COUNT = 3;

function getAnimations(element: HTMLElement) {
  return element.getAnimations?.() ?? [];
}

// 접힌 입력창은 일반 흐름(`auto` 높이), 펼친 입력창은 `absolute`+고정 높이라 CSS transition이 걸리지 않으므로
// 단계(phase)가 바뀐 커밋에서 이전·이후 높이를 재어 Web Animations로 이어 줌.
// 펼침: 입력창이 자리를 비워 둔 채 아래 끝을 고정하고 위로 커짐. 아래 카드는 움직이지 않음.
// 접힘: 전환이 끝날 때까지 `absolute`를 유지해(phase "closing") 아래 끝을 고정한 채 줄어들게 하고, 끝난 뒤 일반 흐름으로 돌아옴.
// 입력창 박스만 움직이면 안쪽(입력 영역·하단 버튼 줄)이 먼저 튀므로 입력 영역도 같은 곡선으로 함께 움직임.
// 접은 뒤 입력창 높이가 펼치기 전 자리와 다르면(그 사이 줄 수가 달라짐) 폼 높이도 함께 움직여 아래 카드가 한 번에 튀지 않게 함.
export function useExpandTransition({
  formRef,
  phase,
  onCollapsed,
}: UseExpandTransitionOptions) {
  const phaseRef = useRef<ExpandPhase>(undefined);

  useLayoutEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const targets = findHeightTargets(form);
    const previousPhase = phaseRef.current;
    phaseRef.current = phase;
    // 처음 그릴 때와 같은 단계의 다시 그리기(입력, 크기 변화)는 전환을 건드리지 않음.
    if (previousPhase === undefined || previousPhase === phase) return;

    // 진행 중이던 전환의 현재 높이를 읽은 뒤 걷어 내고(끝나고 붙들고 있던 값 포함) 새 높이를 잼.
    const isRunning = targets.some((element) =>
      element
        ? getAnimations(element).some(
            ({ playState }) => playState === "running",
          )
        : false,
    );
    const midHeights = isRunning ? measureHeights(form) : undefined;
    const capturedHeights = readCapturedHeights(form);
    targets.forEach((element) => {
      if (element)
        getAnimations(element).forEach((animation) => animation.cancel());
    });
    const heights = measureHeights(form);
    if (phase === "closing" && !form.closest('[data-keyboard="open"]')) {
      // 접은 뒤 폼 높이는 입력창 높이와 같아짐(키보드가 열린 동안은 고정 자리라 그대로).
      heights[0] = heights[1];
    }

    const anims: Animation[] = [];
    if (phase !== "closed") {
      const isOpen = phase === "open";
      const duration = isOpen
        ? EXPAND_TRANSITION_DURATION
        : COLLAPSE_TRANSITION_DURATION;
      const easing = isOpen
        ? EXPAND_TRANSITION_EASING
        : COLLAPSE_TRANSITION_EASING;
      for (let index = 0; index < HEIGHT_TARGET_COUNT; index += 1) {
        const element = targets[index];
        const from = midHeights?.[index] ?? capturedHeights?.[index];
        const to = heights[index];
        if (!element || from === undefined || to === undefined) continue;
        if (from === to || typeof element.animate !== "function") continue;
        // 입력 영역은 클래스에 최대 높이(8줄)가 있어 height만 움직이면 그 값에 눌려 줄어들 때 한 번에 바뀜.
        const animation = element.animate(
          [
            { height: `${from}px`, maxHeight: `${from}px` },
            { height: `${to}px`, maxHeight: `${to}px` },
          ],
          {
            duration,
            easing,
            // 접는 중에는 끝난 값을 붙들어 두었다가 접힌 단계로 바뀔 때 걷어 냄(그 사이에 한 프레임 되돌아가지 않게).
            fill: phase === "closing" ? "forwards" : "none",
          },
        );
        if (isOpen) animation.currentTime = EXPAND_TRANSITION_LEAD;
        anims.push(animation);
      }
    }

    if (phase === "closing") {
      void Promise.all(anims.map((animation) => animation.finished)).then(
        onCollapsed,
        () => {
          // 다시 펼쳐 전환이 취소됨.
        },
      );
    }
  });
}
