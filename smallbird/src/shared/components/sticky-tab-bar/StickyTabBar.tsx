import { useEffect, useRef } from "react";

import { cn } from "@/shared/lib/utils";
import { TabsList, TabsTrigger } from "@/shared/ui/tabs";

import type { ReactNode } from "react";

const ACTIVE_TAB_SELECTOR = '[role="tab"][data-state="active"]';

// 가로로 넘치는 탭 줄에서 선택된 탭이 화면 밖에 있으면 보이는 위치까지 스크롤함(주소로 바로 들어오거나 탭이 바뀔 때).
// 선택 값은 Radix Tabs가 가지고 있어 data-state 변화를 보고 맞춤. 목록의 안쪽 여백(MO 좌우 여백)만큼 띄워 탭이 화면 끝에 붙지 않게 함.
function useScrollActiveTabIntoView<T extends HTMLElement>(isEnabled: boolean) {
  const scrollRef = useRef<T>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!isEnabled || !container) return;

    let isFirst = true;
    const reveal = () => {
      const active = container.querySelector<HTMLElement>(ACTIVE_TAB_SELECTOR);
      const list = active?.parentElement;
      if (!active || !list) return;

      const inset = parseFloat(getComputedStyle(list).paddingLeft) || 0;
      const containerLeft = container.getBoundingClientRect().left;
      const tabRect = active.getBoundingClientRect();
      const start = tabRect.left - containerLeft + container.scrollLeft - inset;
      const end = tabRect.right - containerLeft + container.scrollLeft + inset;
      const viewEnd = container.scrollLeft + container.clientWidth;

      let left: number | null = null;
      if (start < container.scrollLeft) left = start;
      else if (end > viewEnd) left = end - container.clientWidth;

      if (left !== null) {
        const isReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        container.scrollTo({
          left,
          behavior: isFirst || isReducedMotion ? "auto" : "smooth",
        });
      }
      isFirst = false;
    };

    let isDisposed = false;
    reveal();
    const observer = new MutationObserver(reveal);
    observer.observe(container, {
      attributes: true,
      attributeFilter: ["data-state"],
      subtree: true,
    });
    // 글꼴이 늦게 로드돼 탭 폭이 바뀌면 처음 위치가 어긋나므로 다시 맞춤. 그 전에 정리됐으면 하지 않음.
    void document.fonts?.ready.then(() => {
      if (!isDisposed) reveal();
    });

    return () => {
      isDisposed = true;
      observer.disconnect();
    };
  }, [isEnabled]);

  return scrollRef;
}

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
  const scrollRef = useScrollActiveTabIntoView<HTMLDivElement>(scrollable);

  return (
    <div
      ref={scrollRef}
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
