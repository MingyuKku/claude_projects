import { useEffect, useRef, useState } from "react";

import { FloatingButton } from "@/shared/components/floating-button";
import { cn } from "@/shared/lib/utils";

interface ScrollToTopButtonProps {
  /** 버튼 이름(아이콘만 있는 버튼). */
  label: string;
  /** 이만큼(px) 내려가면 나타남. */
  threshold?: number;
  className?: string;
}

// 가장 가까운 세로 스크롤 조상. 앱 셸은 문서가 아니라 `main`이 스크롤하므로 직접 찾음.
function findScrollParent(element: HTMLElement | null) {
  for (
    let parent = element?.parentElement ?? null;
    parent;
    parent = parent.parentElement
  ) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === "auto" || overflowY === "scroll") return parent;
  }
  return null;
}

// 스크롤 목록의 "맨 위로" 버튼(시안 FAB, 오른쪽 아래). 조금 내려가야 나타남.
export function ScrollToTopButton({
  label,
  threshold = 240,
  className,
}: ScrollToTopButtonProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const scroller = findScrollParent(anchorRef.current);
    const target: HTMLElement | Window = scroller ?? window;
    const read = () =>
      setIsVisible(
        (scroller ? scroller.scrollTop : window.scrollY) > threshold,
      );
    read();
    target.addEventListener("scroll", read, { passive: true });
    return () => target.removeEventListener("scroll", read);
  }, [threshold]);

  function handleClick() {
    const scroller = findScrollParent(anchorRef.current);
    (scroller ?? window).scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <span ref={anchorRef} hidden />
      {isVisible && (
        <FloatingButton
          type="scroll"
          aria-label={label}
          className={cn("fixed right-4 bottom-4 z-20", className)}
          onClick={handleClick}
        />
      )}
    </>
  );
}
