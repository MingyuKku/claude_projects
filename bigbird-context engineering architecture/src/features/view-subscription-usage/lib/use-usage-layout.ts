import { useMediaQuery } from "@/shared/lib";

import type { UsageLayout } from "./chart-window";

// 레이아웃 breakpoint는 홈·계정 설정·빅버드 머니와 같음(TAB 768~1439, PC 1440~).
const TABLET_QUERY = "(min-width: 768px)";
const DESKTOP_QUERY = "(min-width: 1440px)";

export function useUsageLayout(): UsageLayout {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const isTabletUp = useMediaQuery(TABLET_QUERY);
  if (isDesktop) return "desktop";
  return isTabletUp ? "tablet" : "mobile";
}
