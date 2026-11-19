// 폼(아래 카드를 미는 자리), 입력창 박스, 입력 영역(textarea) 순서.
export function findHeightTargets(form: HTMLFormElement | null) {
  const pick = (element: Element | null | undefined) =>
    element instanceof HTMLElement ? element : undefined;
  return [
    pick(form),
    pick(form?.firstElementChild),
    pick(form?.querySelector("textarea")),
  ];
}

export function measureHeights(form: HTMLFormElement | null) {
  return findHeightTargets(form).map((element) => element?.offsetHeight);
}

const capturedHeights = new WeakMap<HTMLFormElement, (number | undefined)[]>();

// 펼침·접힘을 시작하는 순간(상태를 바꾸기 직전)의 높이를 기억함. 전환의 시작 높이로 씀.
// 렌더 때 기억해 두면 키보드가 열려 배치만 바뀐 경우처럼 다시 그리지 않고 바뀐 높이를 놓쳐 어긋난 곳에서 시작함.
export function captureExpandHeights(form: HTMLFormElement | null) {
  if (form) capturedHeights.set(form, measureHeights(form));
}

export function readCapturedHeights(form: HTMLFormElement) {
  return capturedHeights.get(form);
}
