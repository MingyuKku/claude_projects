import { createLucideIcon } from "lucide-react";

// Figma 메뉴 아이콘(`Lucide Icons / align-justify`): 세 줄 간격 6(y 6·12·18).
// 설치된 lucide-react 1.x 의 `TextAlignJustify`(align-justify 별칭)는 줄 간격 7(y 5·12·19)이라 시안과 달라짐.
// 같은 API 로 정의해 `size-*`·색(currentColor)·선 굵기를 lucide 아이콘처럼 따름.
export const AlignJustifyIcon = createLucideIcon("align-justify-legacy", [
  ["path", { d: "M3 6h18", key: "top" }],
  ["path", { d: "M3 12h18", key: "middle" }],
  ["path", { d: "M3 18h18", key: "bottom" }],
]);
