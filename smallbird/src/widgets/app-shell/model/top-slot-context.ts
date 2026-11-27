import { createContext } from "react";

/**
 * 본문(`<main>`) 위 고정 영역의 DOM 노드. `undefined`는 셸 밖(단독 렌더·테스트), `null`은 셸 안이지만 노드가 아직 붙기 전.
 */
export const TopSlotContext = createContext<HTMLElement | null | undefined>(
  undefined,
);
