// 앱의 스크롤바 모양 규칙. 같은 규칙을 쓰는 `ScrollArea`(Radix)와 `OverlayScrollbar`(앱 셸 본문)가 가져다 씀.
// 터치 기기의 숨김은 스크롤 영역(`group/scroll-area`) 요소의 `data-idle`을 보고 정해지며, `useScrollbarIdle`이 그 값을 만듦.

/** 막대(thumb): 손 모양 커서, 기본 색. */
export const SCROLLBAR_THUMB_CLASS_NAME =
  "cursor-pointer rounded-full bg-muted-foreground/40 transition-colors";

/** thumb 위에 호버하면 진해짐. */
export const SCROLLBAR_THUMB_HOVER_CLASS_NAME = "hover:bg-muted-foreground/70";

/** 트랙(`group/scrollbar`) 어디에 호버해도 thumb이 진해짐. */
export const SCROLLBAR_TRACK_HOVER_CLASS_NAME =
  "group-hover/scrollbar:bg-muted-foreground/70";

/** 터치 기기(`pointer: coarse`)에서 스크롤 중이 아니면 투명하게 숨김. 마우스 환경은 항상 보임. */
export const SCROLLBAR_TOUCH_IDLE_CLASS_NAME =
  "transition-opacity pointer-coarse:group-data-[idle=true]/scroll-area:opacity-0 pointer-coarse:group-data-[idle=true]/scroll-area:duration-300";
