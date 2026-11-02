// Text Field 계열이 공유하는 입력 영역. Figma에 포커스 링이 없어 커서만 보임.
// iOS(WebKit)는 입력 글자가 16px 미만이면 포커스할 때 화면을 자동 확대하므로, iOS에서만 16px로 키움(Figma는 14px).
// -webkit-touch-callout은 iOS WebKit에만 있어 Android·데스크톱은 14px 그대로.
// 근거: 이 16px 기준은 Apple·WebKit 공식 문서에서 찾지 못했고 실기기 동작(이 프로젝트 iOS에서 확대 발생, 16px 적용 후 사라짐)과
// 널리 알려진 개발 자료(https://css-tricks.com/16px-or-larger-text-prevents-ios-form-zoom/)에 의존함. 확대를 막으려고
// viewport의 maximum-scale·user-scalable=no를 쓰면 사용자 확대가 막혀 접근성을 해치므로 쓰지 않음.
export const fieldTextareaClassName =
  "w-full min-w-0 resize-none bg-transparent text-sm leading-5 text-foreground outline-none scrollbar-slim placeholder:text-muted-foreground disabled:cursor-not-allowed supports-[-webkit-touch-callout:none]:text-base";
