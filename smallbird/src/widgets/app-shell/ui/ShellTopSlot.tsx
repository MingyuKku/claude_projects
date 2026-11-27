import { use } from "react";
import { createPortal } from "react-dom";

import { TopSlotContext } from "../model/top-slot-context";

import type { ReactNode } from "react";

/**
 * 자식을 본문 스크롤 영역 위의 고정 영역에 그림. 본문과 겹치는 스크롤 막대가 이 영역 아래에서 시작해, 스크롤해도 남아야 하는
 * 탭 같은 요소가 막대 옆에 걸치지 않음. 상태는 호출한 화면이 그대로 소유하고 위치만 셸 안으로 옮김.
 * 셸 밖에서는(단독 렌더·테스트) 자리에 그대로 그림.
 */
export function ShellTopSlot({ children }: { children: ReactNode }) {
  const slot = use(TopSlotContext);
  if (slot === undefined) return children;
  if (slot === null) return null;
  return createPortal(children, slot);
}
