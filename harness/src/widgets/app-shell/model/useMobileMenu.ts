import { useRef, useState } from "react";
import { useLocation } from "react-router";

/**
 * 모바일 메뉴 Sheet의 열림 상태와, 닫힐 때 여는 데 쓴 요소로 포커스를 돌려주는 동작.
 * 주소(location.key)가 바뀌면 저절로 닫힘. 누르는 즉시 닫지 않아 이동하는 동안(세션 확인) 누른 메뉴의 스피너가 보임.
 * 열림은 주소에서 파생하지 않고 닫는 이벤트로만 다룸. 연 시점의 key와 비교하면 뒤로가기로 key가 복원될 때 닫혔던 메뉴가 다시 열림.
 */
export function useMobileMenu() {
  const { key: locationKey } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [prevLocationKey, setPrevLocationKey] = useState(locationKey);
  const menuTriggerRef = useRef<HTMLElement | null>(null);

  if (prevLocationKey !== locationKey) {
    setPrevLocationKey(locationKey);
    setIsMenuOpen(false);
  }

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
