// 입력창에 포커스를 주고 커서를 글 끝에 둠.
// iOS는 탭 이벤트 안에서 동기로 focus해야 키보드가 유지되므로 비동기로 미루지 않음.
export function focusTextareaAtEnd(textarea: HTMLTextAreaElement | null) {
  if (!textarea) return;
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);
}
