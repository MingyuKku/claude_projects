import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router";

import {
  FILTER_PANEL,
  FILTER_PANEL_PARAM,
} from "@/shared/components/list-filter";
import { MEDIA_QUERY } from "@/shared/config";
import { useMediaQuery } from "@/shared/lib";

import type { RefObject } from "react";

// 본문 구성이 바뀌는 쿼리. 탭(`useTabParam` 기본 이름)과 빅버드 머니의 세그먼트(`view`)는 내용 길이가 달라
// 위치를 유지하면 짧은 쪽에서 어중간한 곳에 걸림. 쪽·필터·정렬 같은 목록 내부 상태는 넣지 않음.
const CONTENT_PARAMS = ["tab", "view"];
// 뒤로 와서 복원할 때 내용이 아직 그려지지 않아 목표 위치까지 못 내려가면 이 시간 동안 다시 맞춤. 지나면 그 자리에 둠.
const RESTORE_TIMEOUT_MS = 1000;
// 사용자가 직접 스크롤하려는 신호. 이때부터는 복원을 멈춰 손가락 아래에서 화면이 튀지 않게 함.
const USER_SCROLL_EVENTS = ["wheel", "touchstart", "pointerdown", "keydown"];

// 기록(history) 항목(`location.key`)별 스크롤 위치. AppShell이 다시 마운트되는 이동(레이아웃이 다른 화면)에서도 남도록 모듈에 둠.
const positions = new Map<string, number>();

/**
 * 본문(`<main>`)의 스크롤 위치를 화면에 맞춤. 스크롤하는 요소가 window가 아니라 `<main>`이라 React Router의
 * `<ScrollRestoration>`이 닿지 않고, 레이아웃을 공유하는 이동(마이페이지 세 화면, 구독 → 결제 같은 하위 화면, 탭 전환)에서는
 * `<main>`이 유지되어 이전 화면의 스크롤 위치가 그대로 남기 때문.
 * - 화면이 바뀐 것은 경로, 하위 화면(`?panel=`), 탭·세그먼트가 바뀐 때임. 새로 이동하면 맨 위로 보냄.
 * - 뒤로/앞으로 가기는 그 기록 항목을 떠날 때의 위치로 되돌림. 내용이 아직 없으면 잠시 기다려 맞춤.
 * - PC(≥1440)는 하위 화면이 목록 옆 인라인 패널·드로어로 열려 본문이 그대로 남으므로 하위 화면으로 보지 않고 보던 위치를 유지함.
 *   TAB·MO는 하위 화면이 본문을 대체하므로 새 화면으로 보고 맨 위로 보냄.
 * - 필터는 MO에서 목록 위에 모달로 열려(`?panel=filter`) 목록을 되돌리면 안 되므로 하위 화면으로 보지 않음.
 */
export function useScrollRestoration(
  scrollerRef: RefObject<HTMLElement | null>,
) {
  const { key, pathname, search } = useLocation();
  const navigationType = useNavigationType();
  const params = new URLSearchParams(search);
  const panel = params.get(FILTER_PANEL_PARAM);
  const isDesktop = useMediaQuery(MEDIA_QUERY.desktop);
  const isSubScreen = !isDesktop && panel !== FILTER_PANEL;
  const screenKey = [
    pathname,
    isSubScreen ? panel : null,
    ...CONTENT_PARAMS.map((name) => params.get(name)),
  ].join("|");

  // 화면 변경 효과와 스크롤 기록이 항상 지금 기록 항목을 보도록 매 커밋마다 맞춤(다음 효과보다 먼저 선언).
  const currentRef = useRef({ key, navigationType });
  const isRestoringRef = useRef(false);
  useLayoutEffect(() => {
    currentRef.current = { key, navigationType };
  });

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    function handleScroll() {
      // 복원하는 동안 내용이 모자라 잘린 위치가 목표 위치를 덮어쓰지 않게 함.
      if (isRestoringRef.current || !scroller) return;
      positions.set(currentRef.current.key, scroller.scrollTop);
    }

    scroller.addEventListener("scroll", handleScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", handleScroll);
  }, [scrollerRef]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const { key: locationKey, navigationType: type } = currentRef.current;
    const target = type === "POP" ? (positions.get(locationKey) ?? 0) : 0;
    scroller.scrollTop = target;
    if (Math.abs(scroller.scrollTop - target) < 1) return;

    isRestoringRef.current = true;
    const startedAt = performance.now();
    let frame = 0;

    function stop() {
      cancelAnimationFrame(frame);
      isRestoringRef.current = false;
      for (const name of USER_SCROLL_EVENTS)
        scroller?.removeEventListener(name, stop);
    }

    function retry() {
      if (!scroller) return;
      scroller.scrollTop = target;
      const isReached = Math.abs(scroller.scrollTop - target) < 1;
      if (isReached || performance.now() - startedAt > RESTORE_TIMEOUT_MS) {
        stop();
        return;
      }
      frame = requestAnimationFrame(retry);
    }

    for (const name of USER_SCROLL_EVENTS)
      scroller.addEventListener(name, stop, { passive: true });
    frame = requestAnimationFrame(retry);
    return stop;
  }, [scrollerRef, screenKey]);
}
