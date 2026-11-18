import { MEDIA_QUERY } from "@/shared/config";
import { useMediaQuery } from "@/shared/lib";

import type { UsageLayout } from "./chart-window";

// 레이아웃 breakpoint는 홈·계정 설정·빅버드 머니와 같음(TAB 768~1439, PC 1440~).

export function useUsageLayout(): UsageLayout {
  const isDesktop = useMediaQuery(MEDIA_QUERY.desktop);
  const isTabletUp = useMediaQuery(MEDIA_QUERY.tabletUp);
  if (isDesktop) return "desktop";
  return isTabletUp ? "tablet" : "mobile";
}
