import {
  Handshake,
  Headset,
  House,
  ShoppingCart,
  Store,
  UserCog,
  Users,
} from "lucide-react";

import { ROUTES } from "@/shared/config";

import type {
  SidebarNavItemData,
  SidebarNavSubItemData,
} from "@/shared/components/sidebar-nav";

export type ShellNavId =
  | "home"
  | "campaign"
  | "influencerMatching"
  | "influencerMarket"
  | "commerce"
  | "mypage"
  | "support";

// 라벨은 widgets/app-shell 번역(`nav.{id}`)에서 가져옴.
export type ShellNavItem = Omit<
  SidebarNavItemData,
  "id" | "label" | "subItems"
> & {
  id: ShellNavId;
  subItems?: ShellNavSubItem[];
};

export type ShellNavSubItem = Omit<SidebarNavSubItemData, "id" | "label"> & {
  id: "search" | "bigbird" | "buyer" | "subscribe" | "money" | "account";
};

export const HOME_NAV_ITEM: ShellNavItem = {
  id: "home",
  icon: House,
  href: ROUTES.main,
  isActive: true,
};

// 미구현 화면은 목적지를 만들지 않고 비활성 메뉴로 표시함.
export const SHELL_NAV_ITEMS: ShellNavItem[] = [
  HOME_NAV_ITEM,
  { id: "campaign", icon: Handshake },
  {
    id: "influencerMatching",
    icon: Users,
    subItems: [{ id: "search", href: ROUTES.influencerSearch }],
  },
  { id: "influencerMarket", icon: Store, hasSubItems: true },
  { id: "commerce", icon: ShoppingCart },
  {
    id: "mypage",
    icon: UserCog,
    // 접힌 레일의 마이페이지 아이콘은 하위 메뉴 첫 항목(구독, 준비 중)이 아니라 계정 설정으로 이동함.
    href: ROUTES.mypageAccount,
    subItems: [
      { id: "subscribe", href: ROUTES.mypageSubscribe },
      { id: "money", href: ROUTES.mypageMoney },
      { id: "account", href: ROUTES.mypageAccount },
    ],
  },
  {
    id: "support",
    icon: Headset,
    isDefaultOpen: true,
    subItems: [
      { id: "bigbird", href: ROUTES.customerCenterBigbird },
      { id: "buyer", href: ROUTES.customerCenterBuyer },
    ],
  },
];

// 기존 광고주 앱의 이용 가이드 주소를 유지함.
export const CLIENT_GUIDE_URL =
  "https://app.notion.com/p/3d18da2cf42f807a8535dc57072dfd10?source=copy_link";
