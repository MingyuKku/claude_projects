// 입력칸 계열(Input·Select·금액 칸·드롭다운 트리거·날짜 칸)이 함께 쓰는 포커스 링.
// 링은 box-shadow라서 칸마다 transition에 box-shadow가 없으면 링이 서서히 생기지 않고 바로 나타남.
// 클래스를 칸마다 복사해 쓰다 한 곳이 빠진 적이 있어(금액 칸) 한 곳에 모음. 값은 Input(Figma 6918:60663)이 기준.
// Tailwind가 소스에서 클래스를 찾으므로 문자열은 완성된 형태로 둠.

/** 입력칸 자신이 포커스될 때(키보드). */
export const fieldFocusRingClassName =
  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

/** 드롭다운 트리거가 열려 있는 동안. */
export const fieldOpenRingClassName =
  "data-[state=open]:ring-2 data-[state=open]:ring-primary data-[state=open]:ring-offset-2";

/** 테두리 박스 안의 입력이 포커스될 때 박스에 링을 그림(금액 칸). 박스에는 transition이 따로 없어 함께 둠. */
export const fieldWithinRingClassName =
  "transition-shadow has-focus-visible:ring-2 has-focus-visible:ring-primary has-focus-visible:ring-offset-2";
