import { useEffect, useState } from "react";

import { canAnimateExpand } from "../lib/can-animate-expand";
import { captureExpandHeights } from "../lib/expand-heights";
import { EXPAND_BOUNDARY_ATTRIBUTE } from "./constants";

import type { RefObject } from "react";

interface ExpandMetrics {
  /** 펼치기 전 입력창 높이. 펼친 동안 자리를 비워 두어 아래 카드가 움직이지 않게 함. */
  slotHeight: number;
  /** 펼친 입력창 높이. 입력창 아래 끝에서 위로, 사용자에게 보이는 영역 안쪽 위까지. */
  overlayHeight: number;
  /** 접는 중. 전환이 끝날 때까지 입력창은 덮은 채로 아래 끝을 고정하고 줄어듦. */
  isClosing: boolean;
}

export type ExpandPhase = "closed" | "open" | "closing";

interface UseInlineExpandOptions {
  formRef: RefObject<HTMLFormElement | null>;
}

function findBoundary(form: HTMLElement) {
  return form.closest<HTMLElement>(`[${EXPAND_BOUNDARY_ATTRIBUTE}]`);
}

function findScrollport(element: HTMLElement) {
  for (let el = element.parentElement; el; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if (overflowY === "auto" || overflowY === "scroll") return el;
  }
  return null;
}

// 펼친 입력창의 높이 = 입력창 아래 끝에서 본문 안쪽 위까지(히어로·문구를 덮음). 단, 본문 스크롤 영역(main)의 높이(위·아래 여백 제외)를 넘지 않음.
// 본문이 스크롤되어도 같은 값이어야 하므로 현재 스크롤 위치가 아니라 스크롤 영역의 크기로 한도를 둠.
// 키보드가 떠 있으면 셸이 스크롤 영역을 보이는 영역만큼 줄이므로(Android resizes-content, iOS는 AppShell이 visualViewport에 맞춤)
// 이 한도가 곧 키보드 위로 보이는 높이. 입력창 아래 끝은 키보드가 열릴 때 셸이 한 번 보이게 스크롤함(useKeyboardAwareShell).
function measureOverlayHeight(
  form: HTMLElement,
  boundary: HTMLElement | null,
  scrollport: HTMLElement | null,
  slotHeight: number,
) {
  const padding = boundary
    ? Number.parseFloat(getComputedStyle(boundary).paddingTop) || 0
    : 0;
  const contentTop = (boundary?.getBoundingClientRect().top ?? 0) + padding;
  const visibleHeight = scrollport?.clientHeight ?? window.innerHeight;
  const available = Math.min(
    form.getBoundingClientRect().bottom - contentTop,
    visibleHeight - padding * 2,
  );
  return Math.max(available, slotHeight);
}

// 입력창을 제자리에서 펼침: 입력창은 원래 자리에 아래 끝을 두고 위로 커져 히어로·문구를 덮고, 카드는 제자리에 남음.
// 같은 textarea가 그대로 있으므로 포커스와 한글 조합이 끊기지 않음.
// 키보드·창 크기로 본문이나 스크롤 영역의 크기가 바뀌면(ResizeObserver) 높이를 다시 잼. 스크롤 위치는 건드리지 않음.
export function useInlineExpand({ formRef }: UseInlineExpandOptions) {
  const [metrics, setMetrics] = useState<ExpandMetrics>();
  const phase: ExpandPhase = !metrics
    ? "closed"
    : metrics.isClosing
      ? "closing"
      : "open";
  const isExpanded = phase === "open";

  const slotHeight = metrics?.slotHeight;

  useEffect(() => {
    const form = formRef.current;
    if (slotHeight === undefined || !form) return;
    const boundary = findBoundary(form);
    const scrollport = findScrollport(form);
    if (!boundary && !scrollport) return;

    const observer = new ResizeObserver(() => {
      const overlayHeight = measureOverlayHeight(
        form,
        boundary,
        scrollport,
        slotHeight,
      );
      setMetrics((prev) =>
        prev && !prev.isClosing && prev.overlayHeight !== overlayHeight
          ? { ...prev, overlayHeight }
          : prev,
      );
    });
    if (boundary) observer.observe(boundary);
    if (scrollport) observer.observe(scrollport);
    return () => observer.disconnect();
  }, [formRef, slotHeight]);

  function expand() {
    // 접는 중에 다시 펼치면 자리 높이를 새로 재지 않고(폼이 줄어드는 중) 그대로 이어 감.
    if (metrics) {
      captureExpandHeights(formRef.current);
      setMetrics({ ...metrics, isClosing: false });
      return;
    }
    const form = formRef.current;
    if (!form) return;
    captureExpandHeights(form);
    const nextSlotHeight = form.offsetHeight;
    setMetrics({
      slotHeight: nextSlotHeight,
      overlayHeight: measureOverlayHeight(
        form,
        findBoundary(form),
        findScrollport(form),
        nextSlotHeight,
      ),
      isClosing: false,
    });
  }

  // 전환을 보여 줄 수 없으면(모션 줄이기·미지원) 바로 접고, 아니면 접는 중 상태로 두었다가 전환이 끝나면 finishCollapse로 접음.
  function collapse() {
    if (!metrics || metrics.isClosing) return;
    if (canAnimateExpand()) {
      captureExpandHeights(formRef.current);
      setMetrics({ ...metrics, isClosing: true });
    } else setMetrics(undefined);
  }

  // 그 사이 다시 펼쳤으면 접지 않음.
  function finishCollapse() {
    setMetrics((prev) => (prev?.isClosing ? undefined : prev));
  }

  return { isExpanded, phase, metrics, expand, collapse, finishCollapse };
}
