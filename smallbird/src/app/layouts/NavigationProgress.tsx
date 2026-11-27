import { useEffect, useState } from "react";
import { useNavigation } from "react-router";

import { cn } from "@/shared/lib/utils";

// 이동이 이보다 오래 걸릴 때만 보임. 빠른 이동마다 번쩍이지 않게 함(Inertia.js 기본값과 같음).
const SHOW_DELAY_MS = 250;

/**
 * 화면 이동(세션 확인·loader)이 오래 걸리면 화면 맨 위에 진행 바를 보임. 끝을 알 수 없어 천천히 차오르다 멈추고,
 * 이동이 끝나면 끝까지 채운 뒤 사라짐. 새 화면이 그려지는 것으로 알 수 있어 화면 읽기 프로그램에는 숨김.
 */
export function NavigationProgress() {
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";
  const [isShown, setIsShown] = useState(false);
  // 사라지는 중에 새 이동이 시작되면 바를 새로 그려 처음부터 차오르게 함(그대로 두면 끝까지 찬 바가 거꾸로 줄어듦).
  const [runId, setRunId] = useState(0);
  const [wasNavigating, setWasNavigating] = useState(isNavigating);
  if (isNavigating !== wasNavigating) {
    setWasNavigating(isNavigating);
    if (isNavigating) setRunId((id) => id + 1);
  }

  useEffect(() => {
    if (!isNavigating) return;
    const timer = setTimeout(() => setIsShown(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isNavigating]);

  if (!isShown) return null;

  const isFinishing = !isNavigating;

  return (
    <div
      key={runId}
      aria-hidden
      data-slot="navigation-progress"
      data-state={isFinishing ? "finishing" : "loading"}
      className={cn(
        "pointer-events-none fixed top-0 left-0 z-50 h-0.5 bg-primary tablet:h-1",
        isFinishing
          ? "w-full opacity-0 [transition:width_200ms_ease-out,opacity_200ms_ease-out_200ms]"
          : "w-[90%] transition-[width] duration-[10s] ease-out starting:w-0",
      )}
      onTransitionEnd={(event) => {
        if (isFinishing && event.propertyName === "opacity") {
          setIsShown(false);
        }
      }}
    />
  );
}
