import { createContext } from "react";

import type { MenuPermissions } from "@/entities/session";

export const NavigationContext = createContext<{
  /** 비로그인이 로그인이 필요한 메뉴를 눌렀을 때 로그인 안내 알럿을 띄움. */
  showLoginRequired: () => void;
  isAuthenticated: boolean;
  /** 구독은 Master(MASTER·ADMIN)만. Sub ID는 권한과 관계없이 들어갈 수 없음(비로그인은 로그인으로 보냄). */
  canAccessSubscribe: boolean;
  /**
   * 세션(`GET /v3/sec`)의 메뉴 권한 6개. 권한이 없는 Sub ID에게도 메뉴는 보이고 흐리게 비활성함. 비로그인은 null.
   * 지금 화면이 있는 메뉴(인플루언서 검색·빅버드 머니·구매자 문의)에만 적용하고, 나머지는 화면이 생길 때 같은 방식으로 적용함.
   */
  permissions: MenuPermissions | null;
}>({
  showLoginRequired: () => {},
  isAuthenticated: false,
  canAccessSubscribe: false,
  permissions: null,
});
