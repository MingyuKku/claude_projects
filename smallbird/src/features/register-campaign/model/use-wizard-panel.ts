import { MEDIA_QUERY } from "@/shared/config";
import { useMediaQuery, usePanelParam } from "@/shared/lib";

/**
 * 하위 화면(`?panel=`). 뒤로가기로 닫히고 새로고침해도 유지됨.
 * - add-brand: 1단계 브랜드 추가
 * - load-previous: 1단계 이전 캠페인 불러오기
 * (약관 전문 `terms`는 7단계를 만들 때 더함)
 */
export const WIZARD_PANELS = ["add-brand", "load-previous"] as const;
export type WizardPanel = (typeof WIZARD_PANELS)[number];

/**
 * 하위 화면의 열림 상태와 표시 방식. PC(≥1440)는 오른쪽 드로어(딤)이고, TAB·MO는 본문을 바꿔 끼우는 서브 화면(제목 + "×")임.
 * (프로젝트의 `desktop:`는 1440px이므로 스펙의 "PC" 기준폭을 따름.)
 */
export function useWizardPanel() {
  const { panel, openPanel, closePanel } = usePanelParam({
    panels: WIZARD_PANELS,
  });
  const isDrawer = useMediaQuery(MEDIA_QUERY.desktop);

  return { panel, openPanel, closePanel, isDrawer };
}
