import { useEffect, useState } from "react";

import { focusOnMount } from "../lib/focus-on-mount";

import type { ComponentProps } from "react";

// TAB·MO에서 겹쳐 여는 창의 한 겹. 열리면 창으로, 닫히면 열었던 버튼으로 초점을 옮김.
export function FocusLayer(props: ComponentProps<"div">) {
  // 아래 겹이 inert·hidden이 되면 초점이 먼저 사라지므로 그리기 전에 기억함.
  const [opener] = useState(() => document.activeElement);

  useEffect(
    () => () => {
      // 아래 겹이 다시 보인 뒤여야 초점을 받을 수 있음.
      requestAnimationFrame(() => {
        if (opener instanceof HTMLElement && opener.isConnected)
          opener.focus({ preventScroll: true });
      });
    },
    [opener],
  );

  return <div ref={focusOnMount} tabIndex={-1} {...props} />;
}
