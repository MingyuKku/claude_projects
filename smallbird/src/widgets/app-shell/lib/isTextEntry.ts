// 글자를 입력해 가상 키보드를 띄우는 요소인지. 버튼형 input(체크박스·파일 등)은 키보드를 띄우지 않음.
const NON_TEXT_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "hidden",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

export function isTextEntry(element: EventTarget | null) {
  if (element instanceof HTMLTextAreaElement) return true;
  if (element instanceof HTMLInputElement) {
    return !NON_TEXT_INPUT_TYPES.has(element.type);
  }
  // jsdom 등 isContentEditable을 구현하지 않는 환경에서는 undefined라 true일 때만 입력 요소로 봄.
  return element instanceof HTMLElement && element.isContentEditable === true;
}
