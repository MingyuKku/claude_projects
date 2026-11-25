/** `ref`에 넘겨 나타날 때 한 번 초점을 줌. 매 렌더에 다시 불리지 않도록 컴포넌트 밖 함수로 둠. */
export function focusOnMount(element: HTMLElement | null) {
  element?.focus();
}
