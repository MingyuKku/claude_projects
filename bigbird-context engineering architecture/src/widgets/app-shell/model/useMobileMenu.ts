import { useRef, useState } from "react";

/** 모바일 메뉴 Sheet의 열림 상태와, 닫힐 때 여는 데 쓴 요소로 포커스를 돌려주는 동작. */
export function useMobileMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLElement | null>(null);

  function openMenu() {
    menuTriggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setIsMenuOpen(true);
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function handleCloseAutoFocus(event: Event) {
    if (menuTriggerRef.current?.isConnected) {
      event.preventDefault();
      menuTriggerRef.current.focus();
    }
  }

  return {
    isMenuOpen,
    setIsMenuOpen,
    openMenu,
    closeMenu,
    handleCloseAutoFocus,
  };
}
