import { useEffect, useRef } from "react";

const ACTIVE_TAB_SELECTOR = '[role="tab"][data-state="active"]';

interface Options {
  /** 끄면 아무것도 하지 않음(탭이 줄어들어 넘치지 않는 화면). */
  isEnabled?: boolean;
  /** 선택된 탭이 스크롤 영역 가장자리에 붙지 않게 띄우는 간격(px). 기본은 탭 목록의 왼쪽 안쪽 여백. */
  inset?: number;
}

/**
 * 가로로 넘치는 탭 줄에서 선택된 탭이 화면 밖에 있으면 보이는 위치까지 스크롤함(주소로 바로 들어오거나 탭이 바뀔 때).
 * 반환한 ref를 **스크롤하는 요소**(`overflow-x-auto`인 탭 목록의 바깥 요소)에 닮. 가로 스크롤 탭 줄은 모두 이 훅을 씀.
 * 선택 값은 Radix Tabs가 가지고 있어 data-state 변화를 보고 맞춤. 조상의 세로 스크롤은 건드리지 않음.
 */
export function useScrollActiveTabIntoView<T extends HTMLElement>({
  isEnabled = true,
  inset: insetOption,
}: Options = {}) {
  const scrollRef = useRef<T>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!isEnabled || !container) return;

    let isFirst = true;
    const reveal = () => {
      // 숨겨져 있으면(`hidden`·`display: none`) 위치를 잴 수 없어 엉뚱한 곳으로 스크롤하므로 건너뜀.
      if (container.clientWidth === 0) return;
      const active = container.querySelector<HTMLElement>(ACTIVE_TAB_SELECTOR);
      const list = active?.parentElement;
      if (!active || !list) return;

      const inset =
        insetOption ?? (parseFloat(getComputedStyle(list).paddingLeft) || 0);
      const containerLeft = container.getBoundingClientRect().left;
      const tabRect = active.getBoundingClientRect();
      const start = tabRect.left - containerLeft + container.scrollLeft - inset;
      const end = tabRect.right - containerLeft + container.scrollLeft + inset;
      const viewEnd = container.scrollLeft + container.clientWidth;

      let left: number | null = null;
      if (start < container.scrollLeft) left = start;
      else if (end > viewEnd) left = end - container.clientWidth;

      if (left !== null) {
        const isReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        container.scrollTo({
          left,
          behavior: isFirst || isReducedMotion ? "auto" : "smooth",
        });
      }
      isFirst = false;
    };

    let isDisposed = false;
    reveal();
    const observer = new MutationObserver(reveal);
    observer.observe(container, {
      attributes: true,
      attributeFilter: ["data-state"],
      subtree: true,
    });
    // 글꼴이 늦게 로드돼 탭 폭이 바뀌면 처음 위치가 어긋나므로 다시 맞춤. 그 전에 정리됐으면 하지 않음.
    void document.fonts?.ready.then(() => {
      if (!isDisposed) reveal();
    });

    return () => {
      isDisposed = true;
      observer.disconnect();
    };
  }, [isEnabled, insetOption]);

  return scrollRef;
}
