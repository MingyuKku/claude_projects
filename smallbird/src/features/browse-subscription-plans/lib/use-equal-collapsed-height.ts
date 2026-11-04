import { useLayoutEffect, useRef } from "react";

// 시안 구독 탭 카드의 높이(278×384). 문구가 짧은 한국어에서도 이보다 낮아지지 않음.
const BASE_CARD_HEIGHT = 384;

export const CARD_MIN_HEIGHT_VAR = "--plan-card-min-height";

// 카드의 펼침 영역(shared/components/cards/PlanCard). 카드 높이에서 이 높이를 빼면 접힌 상태의 자연 높이가 됨.
const DETAIL_SELECTOR = '[data-slot="plan-card-detail"]';

// 카드 내용을 바꾸는 DOM 변화(문구·카드 추가·삭제·클래스). 우리가 바꾸는 컨테이너 style은 빠져 있어 다시 재도 반복되지 않음.
const CONTENT_MUTATIONS: MutationObserverInit = {
  subtree: true,
  childList: true,
  characterData: true,
  attributeFilter: ["class"],
};

/**
 * 카드끼리 접힌 상태의 높이를 맞추는 최소 높이를 `CARD_MIN_HEIGHT_VAR`로 내려줌.
 * 펼친 카드는 옆 카드를 늘리지 않아야 해서(시안) CSS stretch 대신 접힌 자연 높이의 최댓값을 직접 잼.
 * 펼침 영역의 현재 높이를 빼서 재므로 펼쳐진 카드도 같은 값이 나옴.
 * 카드 내용(언어·결제 주기·카드 수 등)이 바뀌거나 목록 폭·웹폰트가 바뀌어 줄바꿈이 달라지면 다시 잼.
 */
export function useEqualCollapsedHeight<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function measure() {
      if (!container) return;
      // 한 열이면 맞출 옆 카드가 없음.
      if (getComputedStyle(container).gridTemplateColumns.split(" ").length < 2)
        return;
      // 이전 최소 높이를 풀어야 카드의 자연 높이가 읽힘. 같은 동기 구간이라 화면에 깜빡이지 않음.
      container.style.setProperty(CARD_MIN_HEIGHT_VAR, "0px");
      const naturalHeights = Array.from(container.children).map(
        (card) =>
          card.getBoundingClientRect().height -
          (card.querySelector(DETAIL_SELECTOR)?.getBoundingClientRect()
            .height ?? 0),
      );
      container.style.setProperty(
        CARD_MIN_HEIGHT_VAR,
        `${Math.max(BASE_CARD_HEIGHT, ...naturalHeights)}px`,
      );
    }

    measure();

    // 카드 크기 변화로는 내용이 줄어든 것을 알 수 없음(최소 높이가 카드를 붙잡고 있음). 그래서 내용 변화 자체를 봄.
    // 콜백은 커밋 뒤 마이크로태스크라 화면을 그리기 전에 다시 잼.
    const contentObserver =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(measure);
    contentObserver?.observe(container, CONTENT_MUTATIONS);

    // 높이는 우리가 바꾸므로 폭이 달라졌을 때만 다시 잼(높이까지 보면 무한 반복).
    let lastWidth = container.clientWidth;
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            if (container.clientWidth === lastWidth) return;
            lastWidth = container.clientWidth;
            measure();
          });
    resizeObserver?.observe(container);

    // 웹폰트가 늦게 적용되면 글자 폭이 달라져 줄바꿈이 바뀜.
    let isCancelled = false;
    void document.fonts?.ready.then(() => {
      if (!isCancelled) measure();
    });

    return () => {
      isCancelled = true;
      contentObserver?.disconnect();
      resizeObserver?.disconnect();
    };
  }, []);

  return containerRef;
}
