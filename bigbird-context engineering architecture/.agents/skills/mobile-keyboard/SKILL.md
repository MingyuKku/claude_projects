---
name: mobile-keyboard
description: 모바일 가상 키보드, visualViewport, 입력 포커스에 따른 레이아웃·스크롤, 화면 하단 고정 UI(position fixed·sticky), iOS Safari 입력 동작(자동 확대, 입력 보조 막대), 터치에서 pointerdown으로 열리는 메뉴, viewport 메타(interactive-widget)를 다루거나 그 버그를 고칠 때 사용합니다. 추측 금지, 공식 문서·버그 트래커 근거와 실기기 측정 절차, 이 프로젝트에서 시도 후 되돌린 방식과 현재 결정을 담고 있습니다.
---
<!-- GENERATED FILE: 직접 수정 금지. 원본은 .claude/skills/mobile-keyboard/SKILL.md 이며, 수정 후 `python ai/scripts/render_agents.py` 를 실행하세요. -->

# 모바일 가상 키보드·입력 동작 (특히 iOS Safari)

가상 키보드, `visualViewport`, 입력 포커스에 따른 레이아웃·스크롤, 화면 하단에 붙는 UI(`position: fixed`·`sticky`), iOS Safari 고유 입력 동작(자동 확대, 입력 보조 막대 등)을 다루는 작업에 적용합니다.
이 영역은 브라우저·OS 버전마다 동작이 다르고 알려진 버그가 많아, 추측으로 고치면 다른 곳이 깨집니다(홈 키보드 대응에서 실제로 겪음: `specs/home.md` "키보드 활성 배치").

## 원칙: 추측·땜질 금지, 근거 먼저

- 동작을 바꾸기 전에 **공식 근거**를 확인하고, 근거가 없으면 구현하지 말고 사용자에게 보고합니다. "아마 iOS가 이렇게 동작할 것"이라는 가정으로 코드를 쓰지 않습니다.
- 근거의 우선순위:
  1. 공식 문서와 버그 트래커: Apple Developer 문서·포럼, WebKit(`webkit.org` 블로그, `bugs.webkit.org`, Safari 릴리스 노트), Chrome for Developers(`developer.chrome.com`), Android Developers, `web.dev`, MDN, W3C·WHATWG 명세
  2. 대기업 개발팀의 공개 사례(엔지니어링 블로그, 공개 저장소)와 플랫폼 공식 모범 사례
  3. 그 밖의 블로그·Q&A는 보조 근거로만 쓰고, 1·2로 교차 확인합니다
- 근거는 코드 주석과 스펙에 링크나 버그 번호로 남깁니다(예: `WebKit 297779`).

## 절차

1. **재현·측정**: 실기기(또는 iOS Simulator·Android Emulator)에서 `visualViewport.height`·`offsetTop`, `innerHeight`, `scrollY`, 대상 요소의 위치를 수치로 확인합니다. 데스크톱 Chromium의 모바일 에뮬레이션은 가상 키보드, iOS `visualViewport`, 입력 보조 막대를 재현하지 못하므로 **검증 근거로 쓰지 않습니다**(레이아웃 계산 확인용으로만 씁니다).
2. **근거 확인**: 측정한 동작이 플랫폼 사양인지, 알려진 버그인지 위 출처에서 확인합니다.
3. **선택지 보고**: 플랫폼이 지원하지 않는 동작이면 우회 코드를 바로 쓰지 말고, 선택지와 트레이드오프(플랫폼 기본 동작 수용, 디자인 변경, 우회의 위험)를 사용자에게 제시하고 결정을 받습니다.
4. **완료 보고**: 실기기에서 확인한 것과 확인하지 못한 것을 나눠 적습니다.

## 금지

- 출처 없는 고정값: 키보드·입력 보조 막대·주소 표시줄 높이 같은 값을 눈대중 상수로 넣지 않습니다. 웹 API로 알 수 없는 값이면 그 사실을 보고합니다.
- `visualViewport`의 `resize`·`scroll`마다 JS로 레이아웃 높이·위치나 스크롤을 다시 맞추는 방식(셸을 `position: fixed`로 보이는 창에 따라 옮기기, 매번 `scrollIntoView`). 사용자 스크롤과 충돌해 화면이 떨리고, iOS 26의 `offsetTop` 어긋남(WebKit 297779)에 그대로 노출됩니다.
- 접근성을 해치는 강제: `user-scalable=no`, `maximum-scale=1` 같은 확대 차단.
- User-Agent 문자열로 iOS 버전을 가려 분기하기. 기능 감지(`CSS.supports`, `@supports`)를 씁니다.

## 플랫폼 사실 (근거)

- iOS Safari는 키보드가 떠도 레이아웃 뷰포트를 줄이지 않고 `visualViewport`만 줄입니다. Chrome on Android도 108부터 기본값이 같지만 `interactive-widget=resizes-content`로 페이지 자체를 줄일 수 있습니다. [Chrome for Developers: viewport resize behavior](https://developer.chrome.com/blog/viewport-resize-behavior)
- Safari는 `interactive-widget`과 VirtualKeyboard API를 지원하지 않습니다(2021년부터 미해결). [WebKit 230225](https://bugs.webkit.org/show_bug.cgi?id=230225)
- iOS 26에서 키보드를 열고 닫은 뒤 `visualViewport.offsetTop`이 어긋나 `fixed`·`sticky` 요소가 튀는 문제가 있습니다(시스템 구성요소 문제로 분류). [WebKit 297779](https://bugs.webkit.org/show_bug.cgi?id=297779)
- iOS는 안쪽 스크롤 영역이 더 스크롤할 게 없으면 터치 스크롤을 문서 스크롤로 넘깁니다(WebKit 191204).

## 터치와 `pointerdown`

- 터치로 스크롤하려고 손가락만 대도 동작하지 않도록, 터치에서 무언가를 여는·이동하는 동작은 `pointerdown`이 아니라 `click`(또는 이동 거리 확인 후 `pointerup`)에서 처리합니다. 스크롤이 시작되면 브라우저가 `pointercancel`을 보내고 `click`은 발생하지 않습니다.
- Radix `DropdownMenu.Trigger`는 `pointerdown`에 열립니다(radix-ui/primitives [#1912](https://github.com/radix-ui/primitives/issues/1912), WCAG 2.5.2 포인터 취소 [#3124](https://github.com/radix-ui/primitives/issues/3124), 2.1.25 기준 미해결). `shared/ui/dropdown-menu.tsx`가 터치·펜만 `click`으로 열도록 고쳐 두었습니다. Radix를 올리면 이 우회가 여전히 필요한지 확인합니다.

## 이 프로젝트의 현재 결정

- Android: `index.html` viewport 메타에 `interactive-widget=resizes-content`.
- iOS: OS 기본 동작을 따릅니다. 입력하는 동안 헤더가 밀려나는 것은 Safari 기본 동작으로 받아들였습니다(`specs/home.md` "키보드 활성 배치", 방안 A).
- 키보드 열림 감지와 열림 배치: `AppShell`의 `isKeyboardAware`(`data-keyboard`) + 본문 CSS(`in-data-[keyboard=open]:`). iOS에서 `innerHeight` 변화로 배치를 나누는 방식은 스크롤 중 판정이 바뀌어 화면이 덜컹거려 되돌렸습니다. 높이가 줄지 않는 iOS에서 아래 붙이기로 헤더와 제목 사이가 벌어지는 문제는 미해결입니다.
- 키보드 위 입력 보조 막대·주소 표시는 iOS에서 `visualViewport` 바깥이지만 레이아웃 뷰포트 안을 덮습니다. iOS의 `innerHeight`는 주소창 상태에 따라 같은 화면에서도 매번 달라지므로(실측 487·543·641) 이 높이를 재서 레이아웃을 보정하는 방식은 쓰지 않습니다(홈에서 시도 후 효과가 없어 되돌림). 홈에서 이 막대가 버튼 줄을 가리는 문제는 미해결로 남겨 두었습니다(`specs/home.md`).
- 키보드가 열리는 순간 한 번만 `[data-keyboard-anchor]`를 `scrollIntoView({ block: "end" })`로 보이게 하고 여백은 `scroll-margin-bottom`으로 줍니다(iOS는 포커스한 입력의 커서까지만 스크롤해 아래 버튼 줄이 가려짐). `scroll-margin`이 `scrollIntoView`에 적용되는 것은 CSSOM View·CSS Scroll Snap 표준입니다. [MDN scroll-margin-bottom](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-margin-bottom)
- iOS 입력 자동 확대 방지: 입력 글자를 iOS에서만 16px로(`shared/components/text-field/styles.ts`). **공식 근거 없음**: Apple·WebKit 공식 문서에서 16px 기준을 찾지 못했고(2026-10 조사), 실기기 동작(14px에서 확대 발생, 16px 적용 후 사라짐)과 [CSS-Tricks](https://css-tricks.com/16px-or-larger-text-prevents-ios-form-zoom/)(2021, 출처 없는 관찰) 같은 개발 자료에 의존합니다. 확대 차단(`maximum-scale`·`user-scalable=no`)은 접근성 때문에 쓰지 않습니다. WebKit이 기준을 바꾸면 깨질 수 있으니 iOS 업데이트 후 확대가 다시 생기는지 확인합니다.
- `interactive-widget=resizes-content`(`index.html`): 값의 의미는 [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport)과 [Chrome for Developers](https://developer.chrome.com/blog/viewport-resize-behavior)에서 확인했습니다. Chrome for Android 108+, Firefox for Android 132+가 지원하고 Safari는 지원하지 않습니다([WebKit 230225](https://bugs.webkit.org/show_bug.cgi?id=230225)).
