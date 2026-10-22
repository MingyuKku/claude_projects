import { useLocation } from "react-router";

import { useTranslation } from "@/shared/i18n";

import { HOME_NAV_ITEM, SHELL_NAV_ITEMS } from "./navigation";

import type { ShellNavId } from "./navigation";

/** 사이드바 메뉴 항목(번역·활성 상태 반영)과 헤더 제목에 쓰이는 현재 메뉴를 계산함. */
export function useShellNavItems(activeNavId?: ShellNavId) {
  const { t } = useTranslation("widgets/app-shell");
  const { pathname } = useLocation();

  // 하위 경로(예: /customer-center/bigbird/new)도 해당 메뉴의 위치로 봄.
  const isCurrent = (href?: string) =>
    href !== undefined &&
    (pathname === href || pathname.startsWith(`${href}/`));
  const activeNavItem = SHELL_NAV_ITEMS.find((item) => item.id === activeNavId);
  const currentNavItem = activeNavItem ?? HOME_NAV_ITEM;
  const items = SHELL_NAV_ITEMS.map((item) => ({
    ...item,
    label: t(`nav.${item.id}`),
    // 현재 화면이 하위 메뉴이면 그 그룹을 펼쳐 둠.
    isDefaultOpen:
      item.isDefaultOpen ||
      item.subItems?.some((subItem) => isCurrent(subItem.href)),
    // activeNavId가 있으면 그 메뉴만 활성(시안이 없는 화면을 임시로 특정 메뉴 아래에 둘 때).
    isActive: activeNavId ? item.id === activeNavId : isCurrent(item.href),
    subItems: item.subItems?.map((subItem) => ({
      ...subItem,
      label: t(`nav.${subItem.id}`),
      isActive: isCurrent(subItem.href),
    })),
  }));
  const currentSubItem = items
    .flatMap((item) => item.subItems ?? [])
    .find((subItem) => subItem.isActive);

  return { items, activeNavItem, currentNavItem, currentSubItem };
}
