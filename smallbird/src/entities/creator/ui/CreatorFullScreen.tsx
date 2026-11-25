import { FocusLayer } from "./FocusLayer";

import type { ReactNode } from "react";

// TAB·MO에서 셸 본문 여백까지 목록을 덮음. 목록을 남겨 두어 닫으면 보던 스크롤 위치로 돌아감. 부모가 relative여야 함.
export function CreatorFullScreen({ children }: { children: ReactNode }) {
  return (
    <FocusLayer className="absolute -inset-x-(--ds-p-5) -top-(--ds-p-0_5) -bottom-(--ds-p-5) z-20 bg-background outline-none">
      {children}
    </FocusLayer>
  );
}
