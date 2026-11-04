import { useRef, useState } from "react";
import { useLocation } from "react-router";

/**
 * 모바일 메뉴 Sheet의 열림 상태와, 닫힐 때 여는 데 쓴 요소로 포커스를 돌려주는 동작.
 * 열림은 연 시점의 주소(location.key)에 묶여 이동이 끝나면 저절로 닫힘. 누르는 즉시 닫지 않아
 * 이동하는 동안(세션 확인) 누른 메뉴의 스피너가 보임.
 */
export function useMobileMenu() {
  const { key: locationKey } = useLocation();
  const [openedAt, setOpenedAt] = useState<string>();
  const isMenuOpen = openedAt === locationKey;
  const menuTriggerRef = useRef<HTMLElement | null>(null);

  function openMenu() {
    menuTriggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setOpenedAt(locationKey);
  }

  function closeMenu() {
    setOpenedAt(undefined);
  }

  function setIsMenuOpen(isOpen: boolean) {
    setOpenedAt(isOpen ? locationKey : undefined);
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
