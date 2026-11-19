import { useEffect, useState } from "react";

import {
  KEYBOARD_OPEN_SELECTOR,
  KEYBOARD_STATE_ATTRIBUTE,
} from "@/shared/config";

import { canAnimateExpand } from "../lib/can-animate-expand";
import { captureExpandHeights, findHeightTargets } from "../lib/expand-heights";
import { EXPAND_BOUNDARY_ATTRIBUTE, FALLBACK_LINE_HEIGHT } from "./constants";

import type { RefObject } from "react";

interface ExpandMetrics {
  /** 펼치기 전 입력창 높이. 펼친 동안 자리를 비워 두어 아래 카드가 움직이지 않게 함. */
  slotHeight: number;
  /** 펼친 입력창 높이. 입력창 아래 끝에서 위로, 사용자에게 보이는 영역 안쪽 위까지. */
  overlayHeight: number;
  /** 펼치기 직전 접힌 입력창 박스 높이. 펼쳐도 더 커질 수 있는지 가르는 기준. 펼친 동안에도 접힌 때의 값을 유지함. */
  collapsedFieldHeight: number;
  /** 접는 중. 전환이 끝날 때까지 입력창은 덮은 채로 아래 끝을 고정하고 줄어듦. */
  isClosing: boolean;
}

/** 입력창 높이 한도. */
export interface FieldLimit {
  /** 키보드가 열린 동안 입력창 박스의 최대 높이(보이는 영역). 펼친 높이와 같음. */
  maxFieldHeight: number;
  /** maxFieldHeight에서 테두리·패딩·버튼 줄을 뺀 입력 영역의 최대 높이. */
  maxTextareaHeight: number;
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

function readPadding(boundary: HTMLElement | null) {
  const style = boundary ? getComputedStyle(boundary) : null;
  return {
    top: Number.parseFloat(style?.paddingTop ?? "") || 0,
    bottom: Number.parseFloat(style?.paddingBottom ?? "") || 0,
  };
}

// 보이는 영역 = 본문 스크롤 영역(main)의 높이에서 본문 위·아래 여백(서로 다를 수 있음)을 뺀 값.
// 본문이 스크롤되어도 같은 값이어야 하므로 현재 스크롤 위치가 아니라 스크롤 영역의 크기로 잼.
// 키보드가 떠 있으면 셸이 스크롤 영역을 보이는 영역만큼 줄이므로(Android resizes-content, iOS는 AppShell이 visualViewport에 맞춤)
// 이 값이 곧 키보드 위로 보이는 높이.
function measureVisibleHeight(
  boundary: HTMLElement | null,
  scrollport: HTMLElement | null,
) {
  const padding = readPadding(boundary);
  return (
    (scrollport?.clientHeight ?? window.innerHeight) -
    padding.top -
    padding.bottom
  );
}

// 키보드가 없을 때 펼친 높이 = 입력창 아래 끝에서 본문 안쪽 위까지(히어로·문구를 덮음). 단, 보이는 영역을 넘지 않고 입력창 자리보다 작아지지 않음.
function measureOverlayHeight(
  form: HTMLElement,
  boundary: HTMLElement | null,
  scrollport: HTMLElement | null,
  slotHeight: number,
) {
  const contentTop =
    (boundary?.getBoundingClientRect().top ?? 0) + readPadding(boundary).top;
  const available = Math.min(
    form.getBoundingClientRect().bottom - contentTop,
    measureVisibleHeight(boundary, scrollport),
  );
  return Math.max(available, slotHeight);
}

// 키보드가 열린 동안 접힌 입력창이 이미 보이는 영역을 거의 채워 펼쳐도 한 줄 높이 미만만 커질 때(가로 모드처럼 보이는 영역이 낮을 때)는
// 펼친 모습이 접힌 모습과 거의 같아 의미가 없으므로, 본문 위쪽 여백(시안의 펼친 입력창 위 여백)을 빼지 않고 헤더 아래 끝까지 키움(2026-11-10 사용자 결정).
// 키보드가 열린 동안 폼은 본문 아래에 sticky로 고정되어 아래 끝이 늘 같은 선이므로 스크롤 영역 위 끝까지의 거리가 스크롤과 무관하게 일정함.
// 키보드가 없을 때는 폼 위치가 스크롤에 따라 달라 이 높이가 어긋나므로 적용하지 않음.
function measureKeyboardExpandedHeight(
  form: HTMLElement,
  scrollport: HTMLElement | null,
  maxFieldHeight: number,
  collapsedFieldHeight: number,
  lineHeight: number,
) {
  if (maxFieldHeight - collapsedFieldHeight >= lineHeight)
    return maxFieldHeight;
  const flushHeight =
    form.getBoundingClientRect().bottom -
    (scrollport?.getBoundingClientRect().top ?? 0);
  return Math.max(maxFieldHeight, flushHeight);
}

// 키보드가 열린 동안 입력창은 본문 아래에 고정되고 본문만 스크롤되므로(HomeContent), 접혔든 펼쳤든 보이는 영역 안에 들어와야 함.
// 펼친 높이는 보이는 영역 전체(위쪽 여백 제외). 가로 모드처럼 보이는 영역이 낮아도 입력 1줄은 남김(그때만 보이는 영역을 넘음, 2026-11-02 사용자 결정).
// 버튼 줄·패딩 높이는 고정값 대신 입력창 박스와 입력 영역의 높이 차로 잼.
function measureFieldLimit(
  form: HTMLFormElement,
  boundary: HTMLElement | null,
  scrollport: HTMLElement | null,
  slotHeight: number,
  collapsedFieldHeight: number,
) {
  const [, box, textarea] = findHeightTargets(form);
  if (!box || !textarea) return undefined;
  const lineHeight =
    Number.parseFloat(getComputedStyle(textarea).lineHeight) ||
    FALLBACK_LINE_HEIGHT;
  const chromeHeight = box.offsetHeight - textarea.offsetHeight;
  const maxFieldHeight = Math.max(
    measureVisibleHeight(boundary, scrollport),
    chromeHeight + lineHeight,
  );
  const expandedHeight = form.closest(KEYBOARD_OPEN_SELECTOR)
    ? measureKeyboardExpandedHeight(
        form,
        scrollport,
        maxFieldHeight,
        collapsedFieldHeight,
        lineHeight,
      )
    : measureOverlayHeight(form, boundary, scrollport, slotHeight);
  const limit: FieldLimit = {
    maxFieldHeight,
    maxTextareaHeight: maxFieldHeight - chromeHeight,
  };
  return { limit, expandedHeight };
}

function isSameLimit(a: FieldLimit | undefined, b: FieldLimit) {
  return (
    a?.maxFieldHeight === b.maxFieldHeight &&
    a.maxTextareaHeight === b.maxTextareaHeight
  );
}

// 입력창을 제자리에서 펼침: 입력창은 원래 자리에 아래 끝을 두고 위로 커져 히어로·문구를 덮고, 카드는 제자리에 남음.
// 같은 textarea가 그대로 있으므로 포커스와 한글 조합이 끊기지 않음.
// 키보드·창 크기·글 줄 수로 본문, 스크롤 영역, 입력창 크기가 바뀌거나(ResizeObserver) 키보드 열림 배치가 바뀌면(MutationObserver)
// 높이 한도와 펼친 높이를 다시 잼. 스크롤 위치는 건드리지 않음.
export function useInlineExpand({ formRef }: UseInlineExpandOptions) {
  const [metrics, setMetrics] = useState<ExpandMetrics>();
  const [limit, setLimit] = useState<FieldLimit>();
  const phase: ExpandPhase = !metrics
    ? "closed"
    : metrics.isClosing
      ? "closing"
      : "open";
  const isExpanded = phase === "open";

  const slotHeight = metrics?.slotHeight;
  const collapsedFieldHeight = metrics?.collapsedFieldHeight;

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const boundary = findBoundary(form);
    const scrollport = findScrollport(form);
    const [, box] = findHeightTargets(form);
    const keyboardRoot = form.closest(`[${KEYBOARD_STATE_ATTRIBUTE}]`);

    function update() {
      if (!form) return;
      const measured = measureFieldLimit(
        form,
        boundary,
        scrollport,
        slotHeight ?? form.offsetHeight,
        collapsedFieldHeight ?? box?.offsetHeight ?? 0,
      );
      if (!measured) return;
      const { limit: nextLimit, expandedHeight } = measured;
      setLimit((prev) => (isSameLimit(prev, nextLimit) ? prev : nextLimit));
      setMetrics((prev) =>
        prev && !prev.isClosing && prev.overlayHeight !== expandedHeight
          ? { ...prev, overlayHeight: expandedHeight }
          : prev,
      );
    }

    update();
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(update);
    [boundary, scrollport, box].forEach((element) => {
      if (element) resizeObserver?.observe(element);
    });
    // 키보드 열림 배치로 바뀌면 크기가 그대로여도 펼친 높이의 기준이 달라짐.
    const mutationObserver = new MutationObserver(update);
    if (keyboardRoot) {
      mutationObserver.observe(keyboardRoot, {
        attributes: true,
        attributeFilter: [KEYBOARD_STATE_ATTRIBUTE],
      });
    }
    return () => {
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
    };
  }, [formRef, slotHeight, collapsedFieldHeight]);

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
    const nextCollapsedFieldHeight =
      findHeightTargets(form)[1]?.offsetHeight ?? nextSlotHeight;
    const measured = measureFieldLimit(
      form,
      findBoundary(form),
      findScrollport(form),
      nextSlotHeight,
      nextCollapsedFieldHeight,
    );
    setMetrics({
      slotHeight: nextSlotHeight,
      overlayHeight: measured?.expandedHeight ?? nextSlotHeight,
      collapsedFieldHeight: nextCollapsedFieldHeight,
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

  return {
    isExpanded,
    phase,
    metrics,
    limit,
    expand,
    collapse,
    finishCollapse,
  };
}
