import { cn } from "@/shared/lib/utils";
import { TabsList, TabsTrigger } from "@/shared/ui/tabs";

import type { ReactNode } from "react";

export interface StickyTabBarItem {
  value: string;
  label: ReactNode;
}

interface StickyTabBarProps {
  tabs: readonly StickyTabBarItem[];
  /** 탭이 넘치면 가로로 스크롤함(탭은 줄어들지 않음). 끄면 MO에서 탭이 폭을 나눠 가짐. */
  scrollable?: boolean;
  className?: string;
}

// 마이페이지 탭 줄: 스크롤해도 화면 위에 고정함. <Tabs> 안에 둠.
// 마이페이지 레이아웃(<main>)의 좌우 여백(--mypage-gutter)은 스크롤 영역의 padding이라 그 안의 sticky 요소 배경이 덮지 못함.
// 그래서 모든 화면 폭에서 여백만큼 바깥으로 나갔다가 안쪽 여백으로 되돌려, 배경이 여백까지 덮어 스크롤 내용이 옆으로 비치지 않게 함.
// 위 여백은 고정 영역이 직접 가져 스크롤 내용이 그 위로 비치지 않게 함(기본 8px, 화면마다 className으로 바꿈).
// z-10은 본문 안의 z-index가 탭 줄 위로 올라오지 않게 하는 탭 본문(isolate)과 짝임.
export function StickyTabBar({
  tabs,
  scrollable = false,
  className,
}: StickyTabBarProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 -mx-(--mypage-gutter) bg-background pt-2",
        // 스크롤하면 잘리는 위치가 콘텐츠 여백이 아니라 화면 가장자리가 되도록, MO는 첫 탭을 콘텐츠 선에 맞추는 여백을 목록이 가짐.
        scrollable
          ? "overflow-x-auto tablet:px-(--mypage-gutter)"
          : "px-(--mypage-gutter)",
        className,
      )}
    >
      <TabsList
        variant="line"
        className={cn(
          "w-full justify-start",
          scrollable && "min-w-max px-(--mypage-gutter) tablet:px-0",
        )}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={scrollable ? "flex-none" : "flex-1 tablet:flex-none"}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
}
