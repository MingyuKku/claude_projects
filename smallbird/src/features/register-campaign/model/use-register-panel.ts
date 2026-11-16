import { usePanelParam } from "@/shared/lib";

// 1단계 하위 화면(`?panel=`). 뒤로가기로 닫히고 새로고침해도 유지됨(스펙 §3 하위 화면).
// PC는 오른쪽 드로어, TAB·MO는 본문을 바꿔 끼우는 서브 화면.
export const REGISTER_PANELS = [
  "brands",
  "add-brand",
  "load-previous",
] as const;
export type RegisterPanel = (typeof REGISTER_PANELS)[number];

export function useRegisterPanel() {
  return usePanelParam({ panels: REGISTER_PANELS });
}
