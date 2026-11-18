import { useRef, useState } from "react";

// TAB 이하 폭 경계. 전역 스타일시트의 `--breakpoint-introtab`(1240px)과 같은 지점이며 함께 바꿈.
const TAB_AND_BELOW_QUERY = "(max-width: 1239.98px)";

/** 호버 때 재생하는 카드 비디오의 재생·정지와 재생 가능 상태를 다룸. */
export function useHoverVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // canplay 가 도착했는지. 파일이 없으면 false 로 남음.
  const [isReady, setIsReady] = useState(false);

  function play() {
    // 재생 조건이 맞지 않으면 play() 가 reject 되는데, catch 가 없으면 콘솔에 처리되지 않은 reject 가 남음.
    const playing = videoRef.current?.play();
    playing?.catch(() => {});
  }

  function stop() {
    // TAB·MO 에서는 호버와 무관하게 비디오가 계속 재생됨(디자인 QA).
    // 폭을 줄인 데스크톱 브라우저도 mouseleave 로 멈추면 안 되므로 폭 기준으로 가름.
    if (window.matchMedia(TAB_AND_BELOW_QUERY).matches) return;

    const element = videoRef.current;
    if (!element) return;
    element.pause();
    // 다음 호버는 처음부터 다시 시작함.
    element.currentTime = 0;
  }

  function markReady() {
    setIsReady(true);
  }

  return { videoRef, isReady, play, stop, markReady };
}
