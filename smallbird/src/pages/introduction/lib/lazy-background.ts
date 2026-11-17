// 화면 아래 섹션의 배경 이미지는 가까워졌을 때 받음. 첫 화면과 대역폭을 나눠 쓰지 않게 함.
//
// 대상은 `data-lazy-bg` 로 표시하고 `LAZY_BG` 클래스와 함께 씀. `data-bg-ready` 가 붙기 전에는
// 그 클래스가 배경을 none 으로 덮어 브라우저가 이미지를 요청하지 않음.
// reveal 과 같은 이유로 IntersectionObserver 대신 위치를 직접 잼(reveal.ts 참고).

// 스크롤 컨테이너 아래로 컨테이너 높이의 이 배수 안에 들어오면 받기 시작함.
// 빠르게 스크롤해도 섹션이 보이기 전에 받아 두도록 여유를 둠.
const PRELOAD_VIEWPORTS = 1.5;

const LAZY_BG_SELECTOR = "[data-lazy-bg]";
const BG_READY_ATTRIBUTE = "data-bg-ready";

export interface LazyBackground {
  check(): void;
}

const NOOP: LazyBackground = { check() {} };

/** @param root 스크롤 컨테이너 */
export function createLazyBackground(root: HTMLElement | null): LazyBackground {
  if (!root) return NOOP;

  let pending = Array.from(
    root.querySelectorAll<HTMLElement>(LAZY_BG_SELECTOR),
  );
  if (!pending.length) return NOOP;

  return {
    check() {
      if (!pending.length) return;
      const line =
        root.getBoundingClientRect().bottom +
        root.clientHeight * PRELOAD_VIEWPORTS;
      pending = pending.filter((element) => {
        if (element.getBoundingClientRect().top >= line) return true;
        element.setAttribute(BG_READY_ATTRIBUTE, "");
        return false;
      });
    },
  };
}
