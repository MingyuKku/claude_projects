import { ScrollableTabsList } from "@/shared/components/scrollable-tabs-list";
import { cn } from "@/shared/lib/utils";
import { TabsList, TabsTrigger } from "@/shared/ui/tabs";

import type { ScrollableTabsBleed } from "@/shared/components/scrollable-tabs-list";
import type { CssVariableStyle } from "@/shared/lib/css-variable-style";
import type { ReactNode } from "react";

export interface StickyTabBarItem {
  value: string;
  label: ReactNode;
}

interface StickyTabBarProps {
  tabs: readonly StickyTabBarItem[];
  /** 부모(스크롤 영역)의 좌우 여백(CSS 길이, 예: `var(--mypage-gutter)`). 배경이 이 여백까지 덮음. */
  gutter: string;
  /** 탭이 넘치면 가로로 스크롤함(탭은 줄어들지 않음). 끄면 MO에서 탭이 폭을 나눠 가짐. */
  scrollable?: boolean;
  /** 스크롤할 때 화면 끝까지 갈 범위(`ScrollableTabsList`의 `bleed`). */
  scrollBleed?: ScrollableTabsBleed;
  className?: string;
}

// 스크롤해도 화면 위에 고정되는 탭 줄. <Tabs> 안에 둠.
// 부모 스크롤 영역의 좌우 여백(gutter)은 padding이라 그 안의 sticky 요소 배경이 덮지 못함.
// 그래서 모든 화면 폭에서 여백만큼 바깥으로 나갔다가 안쪽 여백으로 되돌려, 배경이 여백까지 덮어 스크롤 내용이 옆으로 비치지 않게 함.
// 위 여백은 고정 영역이 직접 가져 스크롤 내용이 그 위로 비치지 않게 함(기본 8px, 화면마다 className으로 바꿈).
// z-10은 본문 안의 z-index가 탭 줄 위로 올라오지 않게 하는 탭 본문(isolate)과 짝임.
export function StickyTabBar({
  tabs,
  gutter,
  scrollable = false,
  scrollBleed = "mobile",
  className,
}: StickyTabBarProps) {
  const style: CssVariableStyle = { "--tab-bar-gutter": gutter };
  const triggers = tabs.map((tab) => (
    <TabsTrigger
      key={tab.value}
      value={tab.value}
      className={scrollable ? "flex-none" : "flex-1 tablet:flex-none"}
    >
      {tab.label}
    </TabsTrigger>
  ));

  return (
    <div
      style={style}
      className={cn(
        "sticky top-0 z-10 -mx-(--tab-bar-gutter) bg-background px-(--tab-bar-gutter) pt-2",
        className,
      )}
    >
      {scrollable ? (
        <ScrollableTabsList
          variant="line"
          {...(scrollBleed === "none"
            ? { bleed: "none" }
            : { bleed: scrollBleed, gutter })}
        >
          {triggers}
        </ScrollableTabsList>
      ) : (
        <TabsList variant="line" className="w-full justify-start">
          {triggers}
        </TabsList>
      )}
    </div>
  );
}
