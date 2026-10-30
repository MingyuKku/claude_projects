import { useEffect, useRef } from "react";

// 탭(Radix Tabs)은 `active`, 선택 토글(Radix RadioGroup)은 `checked`가 선택된 항목임.
const ACTIVE_TRIGGER_SELECTOR = '[data-state="active"], [data-state="checked"]';
const TRIGGER_SELECTOR = '[role="tab"], [role="radio"]';

/**
 * 탭 목록(또는 선택 토글) 안에서 선택된 항목(`data-state="active"`·`"checked"`)의 위치·크기를 따라다니는 표시 요소(밑줄·흰 알약)용 훅.
 * 반환한 ref를 표시 요소에 달면 요소의 부모(탭 목록, `position: relative`)를 기준으로 위치를 CSS 변수
 * (`--tab-x`·`--tab-y`·`--tab-w`·`--tab-h`)에 써 줌. 이 변수는 렌더와 무관한 DOM 측정값이라 React 상태로 두지 않고 직접 씀.
 * - 선택이 바뀌면 `data-state` 변화를 보고 다시 잼(Radix의 값·제어 방식과 무관).
 * - 목록·탭 크기가 바뀌면(리사이즈, 글꼴 로딩, 숨김 해제, 언어 변경) 다시 잼.
 * - 처음 잰 값은 애니메이션 없이 적용하고(`data-measured`), 다음 프레임부터 움직임(`data-animate`)을 켬.
 */
export function useActiveTabIndicator<T extends HTMLElement>() {
  const indicatorRef = useRef<T>(null);

  useEffect(() => {
    const indicator = indicatorRef.current;
    const list = indicator?.parentElement;
    if (!indicator || !list) return;

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => measure());

    function measure() {
      const active = list?.querySelector<HTMLElement>(ACTIVE_TRIGGER_SELECTOR);
      if (!indicator) return;
      if (!active) {
        indicator.removeAttribute("data-measured");
        return;
      }
      indicator.style.setProperty("--tab-x", `${active.offsetLeft}px`);
      indicator.style.setProperty("--tab-y", `${active.offsetTop}px`);
      indicator.style.setProperty("--tab-w", `${active.offsetWidth}px`);
      indicator.style.setProperty("--tab-h", `${active.offsetHeight}px`);
      indicator.setAttribute("data-measured", "");
    }

    function observeTriggers() {
      resizeObserver?.disconnect();
      if (!list) return;
      resizeObserver?.observe(list);
      for (const trigger of list.querySelectorAll(TRIGGER_SELECTOR)) {
        resizeObserver?.observe(trigger);
      }
    }

    measure();
    observeTriggers();
    const mutationObserver = new MutationObserver((records) => {
      measure();
      // 탭이 늘거나 줄었으면 크기를 지켜볼 대상도 다시 잡음.
      if (records.some((record) => record.type === "childList")) {
        observeTriggers();
      }
    });
    mutationObserver.observe(list, {
      attributes: true,
      attributeFilter: ["data-state"],
      childList: true,
      subtree: true,
    });
    // 첫 위치는 움직임 없이 놓고, 다음 프레임부터 이동 애니메이션을 켬.
    const frame = requestAnimationFrame(() =>
      indicator.setAttribute("data-animate", ""),
    );
    // 글꼴이 늦게 로드돼 탭 폭이 바뀌는 경우.
    void document.fonts?.ready.then(measure);

    return () => {
      cancelAnimationFrame(frame);
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
    };
  }, []);

  return indicatorRef;
}
