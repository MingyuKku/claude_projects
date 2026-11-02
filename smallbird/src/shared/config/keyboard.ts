// 셸(widgets/app-shell)이 가상 키보드가 떠 있는지 루트에 알리는 속성. 본문은 Tailwind `in-data-[keyboard=open]:`으로,
// 스크립트는 아래 값으로 읽음. 기능은 위젯을 임포트할 수 없어(FSD) 여기에 둠.
export const KEYBOARD_STATE_ATTRIBUTE = "data-keyboard";
export const KEYBOARD_OPEN_SELECTOR = `[${KEYBOARD_STATE_ATTRIBUTE}="open"]`;
