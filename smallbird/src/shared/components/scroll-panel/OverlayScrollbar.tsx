import { useEffect, useRef } from "react";

import {
  SCROLLBAR_THUMB_CLASS_NAME,
  SCROLLBAR_THUMB_HOVER_CLASS_NAME,
  SCROLLBAR_TOUCH_IDLE_CLASS_NAME,
} from "@/shared/lib/scrollbar-style";
import { useScrollbarIdle } from "@/shared/lib/useScrollbarIdle";
import { cn } from "@/shared/lib/utils";

import type { PointerEvent, RefObject, WheelEvent } from "react";

const MIN_THUMB_HEIGHT = 24;

interface OverlayScrollbarProps {
  /** 기본 스크롤바를 숨긴(`scrollbar-hidden`) 스크롤 요소. */
  scrollerRef: RefObject<HTMLElement | null>;
}

// 마우스는 항상 보이고 막대에 호버하면 손 모양 커서와 진한 색이 됨. 터치 기기는 스크롤 중이 아니면 숨김(`ScrollArea`와 같은 규칙).
// 스크롤 요소를 바꾸지 않고 그 위에 세로 막대만 그림(스크롤 위치 복원·sticky·키보드 배치가 원래 요소를 기준으로 함).
// 스크롤 요소의 형제로 relative 부모 안에 둠. 키보드·보조 기술은 원래 요소를 스크롤하므로 막대는 숨김.
export function OverlayScrollbar({ scrollerRef }: OverlayScrollbarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerY: number; scrollTop: number } | null>(null);
  const { isIdle, reveal } = useScrollbarIdle();

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let frame = 0;

    function draw() {
      const track = trackRef.current;
      const thumb = thumbRef.current;
      if (!scroller || !track || !thumb) return;
      const { clientHeight, scrollHeight, scrollTop } = scroller;
      const wasHidden = track.hidden;
      track.hidden = scrollHeight <= clientHeight + 1;
      if (track.hidden) return;
      // 내용이 늦게 차서 막대가 나중에 생겨도 그때 잠시 보임.
      if (wasHidden) reveal();
      const trackHeight = thumb.parentElement?.clientHeight ?? clientHeight;
      const height = Math.max(
        MIN_THUMB_HEIGHT,
        (trackHeight * clientHeight) / scrollHeight,
      );
      const ratio = scrollTop / (scrollHeight - clientHeight);
      thumb.style.height = `${height}px`;
      thumb.style.transform = `translateY(${Math.max(0, Math.min(1, ratio)) * (trackHeight - height)}px)`;
    }

    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    }

    function handleScroll() {
      reveal();
      schedule();
    }

    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(scroller);
    for (const child of scroller.children) resizeObserver.observe(child);
    // 높이를 채우는 자식 안에서 내용만 넘치면 크기가 바뀌지 않으므로 내용 변화도 봄.
    const mutationObserver = new MutationObserver(() => {
      for (const child of scroller.children) resizeObserver.observe(child);
      schedule();
    });
    mutationObserver.observe(scroller, { childList: true, subtree: true });
    scroller.addEventListener("scroll", handleScroll, { passive: true });
    draw();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      scroller.removeEventListener("scroll", handleScroll);
    };
  }, [scrollerRef, reveal]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerY: event.clientY,
      scrollTop: scroller.scrollTop,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const scroller = scrollerRef.current;
    const drag = dragRef.current;
    const thumb = event.currentTarget;
    if (!scroller || !drag) return;
    const room = (thumb.parentElement?.clientHeight ?? 0) - thumb.offsetHeight;
    if (room <= 0) return;
    scroller.scrollTop =
      drag.scrollTop +
      ((event.clientY - drag.pointerY) / room) *
        (scroller.scrollHeight - scroller.clientHeight);
  }

  function handlePointerEnd() {
    dragRef.current = null;
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    scrollerRef.current?.scrollBy({ top: event.deltaY });
  }

  return (
    <div
      ref={trackRef}
      aria-hidden
      hidden
      data-idle={isIdle}
      className="group/scroll-area pointer-events-none absolute inset-y-0 right-0 z-30 w-3 p-0.5"
    >
      <div className={cn("h-full", SCROLLBAR_TOUCH_IDLE_CLASS_NAME)}>
        <div
          ref={thumbRef}
          className={cn(
            "pointer-events-auto touch-none",
            SCROLLBAR_THUMB_CLASS_NAME,
            SCROLLBAR_THUMB_HOVER_CLASS_NAME,
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onWheel={handleWheel}
        />
      </div>
    </div>
  );
}
