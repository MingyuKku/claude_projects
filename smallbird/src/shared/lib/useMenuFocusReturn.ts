import { useRef } from "react";

// 포인터로 열면 트리거가 포커스를 받지 않았는데, 닫힐 때 Radix 가 포커스를 되돌리면 브라우저가 그 포커스를
// :focus-visible 로 봐서 링이 생김. 포인터로 열고 닫은 경우에만 되돌리지 않고, 키보드를 쓰면 그대로 되돌려 접근성을 유지함.
export function useMenuFocusReturn() {
  const isOpenedByPointerRef = useRef(false);

  return {
    /** 트리거의 onPointerDown 에 연결. */
    onPointerDown: () => {
      isOpenedByPointerRef.current = true;
    },
    /** 트리거와 메뉴 content 의 onKeyDown 에 연결. */
    onKeyDown: () => {
      isOpenedByPointerRef.current = false;
    },
    /** 메뉴 content 의 onCloseAutoFocus 에 연결. */
    onCloseAutoFocus: (event: Event) => {
      if (isOpenedByPointerRef.current) event.preventDefault();
    },
  };
}
