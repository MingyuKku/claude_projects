// 스크롤 기반 reveal: 콘텐츠가 뷰포트에 들어오면 떠오름.
//
// 대상은 클래스 목록이 아니라 `data-reveal` 로 표시해, 안쪽 클래스 이름을 바꿔도 여기를 같이 고칠 필요가 없게 함.
// 히어로는 일부러 표시하지 않음: 로드 때 이미 화면에 있어서, 애니메이션을 주면 로딩이 느린 것처럼 보임.

// 같은 부모 아래 형제는 하나씩 조금씩 늦게 나타나 한 줄의 카드가 차례로 떠오름.
// 네 번째에서 상한을 둠: 한 그룹에 카드가 8장이면 마지막 카드가 나머지보다 한참 뒤에 나타나 멈춘 것처럼 느껴짐.
const STAGGER_MS = 120;
const STAGGER_MAX = 3;

// 요소가 뷰포트 아래에서 이 비율만큼 올라왔을 때 발동함.
// 1.0 이면 가장자리에 닿는 순간 시작해 눈이 닿기 전에 이미 다 떠올라 있음.
const TRIGGER_RATIO = 0.88;

const REVEAL_SELECTOR = "[data-reveal]";
const REVEALED_ATTRIBUTE = "data-revealed";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export interface Reveal {
  check(): void;
}

const NOOP: Reveal = { check() {} };

function staggerDelay(
  element: Element,
  seen: Map<ParentNode | null, number>,
): number {
  const parent = element.parentNode;
  const order = seen.get(parent) ?? 0;
  seen.set(parent, order + 1);
  return Math.min(order, STAGGER_MAX) * STAGGER_MS;
}

/**
 * reveal 대상을 등록하고, 스크롤마다 호출할 `check()` 를 돌려줌.
 *
 * IntersectionObserver 대신 위치를 직접 잰 이유: 큰 점프(앵커 링크, 새로고침, 휠을 세게 굴려 여러 화면 건너뜀)는
 * 교차 임계값을 건너뛰어 콜백이 한 번도 불리지 않을 수 있고, 그 블록이 영영 숨겨진 채 남음.
 * 위치를 재면 그런 구멍이 없음 - 이미 지나친 블록도 보임.
 *
 * @param root 스크롤 컨테이너
 */
export function createReveal(root: HTMLElement | null): Reveal {
  if (!root) return NOOP;

  let pending = Array.from(root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
  if (!pending.length) return NOOP;

  // 모션 감소를 쓰는 사용자에게는 모두 한 번에 보여 줌. CSS 는 `data-revealed` 를 보이는 상태로 취급함.
  if (window.matchMedia?.(REDUCED_MOTION_QUERY).matches) {
    pending.forEach((element) => element.setAttribute(REVEALED_ATTRIBUTE, ""));
    return NOOP;
  }

  const seen = new Map<ParentNode | null, number>();
  pending.forEach((element) => {
    const delay = staggerDelay(element, seen);
    if (delay) element.style.transitionDelay = `${delay}ms`;
  });

  return {
    check() {
      if (!pending.length) return;
      const line =
        root.getBoundingClientRect().top + root.clientHeight * TRIGGER_RATIO;
      pending = pending.filter((element) => {
        if (element.getBoundingClientRect().top >= line) return true;
        // 한 번 나타나면 되돌아가지 않음.
        element.setAttribute(REVEALED_ATTRIBUTE, "");
        return false;
      });
    },
  };
}
