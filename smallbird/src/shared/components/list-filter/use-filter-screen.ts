import { MEDIA_QUERY } from "@/shared/config";
import { useMediaQuery } from "@/shared/lib";
import { usePanelParam } from "@/shared/lib/usePanelParam";

import { FILTER_PANEL } from "./constants";

/** 툴바가 인라인으로 바뀌는 폭. `tablet`은 TAB부터(기본), `desktop`은 PC부터(TAB·MO는 "필터" 버튼). */
export type InlineFrom = "tablet" | "desktop";

/**
 * 필터를 본문을 대체하는 화면(TAB)으로 열어야 하는지. 툴바가 "필터" 버튼으로 바뀌지만 MO 모달이 아닌 폭,
 * 곧 `inlineFrom="desktop"`인 목록의 TAB(768~1439px)에서 `?panel=filter`가 열려 있을 때 참.
 * 화면을 쓰는 쪽이 목록과 툴바 대신 `FilterScreen`을 그림.
 */
export function useFilterScreen(inlineFrom: InlineFrom) {
  const isTabletUp = useMediaQuery(MEDIA_QUERY.tabletUp);
  const isDesktop = useMediaQuery(MEDIA_QUERY.desktop);
  const { panel, closePanel } = usePanelParam({ panels: [FILTER_PANEL] });
  const isScreenWidth = inlineFrom === "desktop" && isTabletUp && !isDesktop;

  return { isOpen: isScreenWidth && panel === FILTER_PANEL, close: closePanel };
}
