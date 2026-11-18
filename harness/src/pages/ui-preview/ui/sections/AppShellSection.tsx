import {
  ChevronRight,
  Download,
  Handshake,
  Headset,
  House,
  Plus,
  RotateCcw,
  ShoppingCart,
  UserCog,
  Users,
  X,
} from "lucide-react";

import logo from "@/shared/assets/img/brand/logo.svg";
import { AlertList, AlertListItem } from "@/shared/components/alert-list";
import {
  AppHeader,
  HeaderAlertButton,
  HeaderGuestActions,
  HeaderPointButton,
  SubHeader,
  UserMenu,
} from "@/shared/components/app-header";
import { Dimmed } from "@/shared/components/dimmed";
import {
  SidebarNav,
  SidebarNavItem,
  SidebarRailItem,
} from "@/shared/components/sidebar-nav";
import { Avatar, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

import { PreviewMatrix, previewStateProps } from "../PreviewMatrix";
import { Section } from "../Section";

import type { AlertListItemData } from "@/shared/components/alert-list";
import type { SidebarNavItemData } from "@/shared/components/sidebar-nav";
import type { ComponentProps } from "react";

// Figma New Components(5058:77449)의 Header·Sidebar·Dimmed·Alert List 문서 배치를 따름.
// Header / Main은 tablet(768) 이상에서 PC 레이아웃이 되므로, 좁은 창에서는 PC 행도 모바일 모양으로 보임.
const USER = { name: "김빅링크", email: "harukim000101@gmail.com" };
const MENU_ITEM = "Menu Item";
const SUB_ITEMS = ["1", "2", "3", "4"].map((id) => ({
  id,
  label: MENU_ITEM,
  href: "#",
}));

const NAV_ITEMS: SidebarNavItemData[] = [
  { id: "home", label: "홈", icon: House, href: "#", isActive: true },
  { id: "campaign", label: "캠페인", icon: Handshake, href: "#" },
  {
    id: "influencer",
    label: "인플루언서",
    icon: Users,
    subItems: SUB_ITEMS,
  },
  { id: "commerce", label: "커머스 판매현황", icon: ShoppingCart, href: "#" },
  { id: "mypage", label: "마이페이지", icon: UserCog, subItems: SUB_ITEMS },
  { id: "support", label: "고객센터", icon: Headset, subItems: SUB_ITEMS },
];

const ALERT_ITEMS: AlertListItemData[] = [
  {
    id: "1",
    type: "success",
    title: "캠페인이 승인되었습니다.",
    description: "뷰티 브랜드 신제품 체험단 캠페인이 승인되었습니다.",
    date: "2027.12.12",
    time: "00:00",
  },
  {
    id: "2",
    type: "destructive",
    title: "캠페인이 거절되었습니다.",
    description: "뷰티 브랜드 신제품 체험단 캠페인이 거절되었습니다.",
    date: "2027.12.12",
    time: "00:00",
  },
  {
    id: "3",
    type: "success",
    title: "캠페인이 승인되었습니다.",
    description: "뷰티 브랜드 신제품 체험단 캠페인이 승인되었습니다.",
    date: "2027.12.12",
    time: "00:00",
    isRead: true,
  },
  {
    id: "4",
    type: "destructive",
    title: "캠페인이 거절되었습니다.",
    description: "뷰티 브랜드 신제품 체험단 캠페인이 거절되었습니다.",
    date: "2027.12.12",
    time: "00:00",
    isRead: true,
  },
  {
    id: "5",
    type: "success",
    title: "캠페인이 승인되었습니다.",
    description: "뷰티 브랜드 신제품 체험단 캠페인이 승인되었습니다.",
    date: "2027.12.12",
    time: "00:00",
    isRead: true,
  },
];

const USER_MENU_LABELS = {
  menuLabel: "내 메뉴",
  settingsLabel: "설정",
  logoutLabel: "로그아웃",
};

type HeaderRow = "Log-In, Alert=False" | "Log-In, Alert=True" | "Log-Out";
const HEADER_ROWS: HeaderRow[] = [
  "Log-In, Alert=False",
  "Log-In, Alert=True",
  "Log-Out",
];

function Caption({ children }: { children: string }) {
  return (
    <span className="text-xs font-medium text-muted-foreground">
      {children}
    </span>
  );
}

function MainHeader({ row, title }: { row: HeaderRow; title?: string }) {
  return (
    <AppHeader title={title} icon={<House />} menuLabel="메뉴 열기">
      {row === "Log-Out" ? (
        <HeaderGuestActions guideLabel="이용 가이드" loginLabel="로그인" />
      ) : (
        <>
          <HeaderPointButton amount="999,999" label="포인트" />
          <HeaderAlertButton
            label="알림"
            hasUnread={row === "Log-In, Alert=True"}
          />
          <UserMenu {...USER} {...USER_MENU_LABELS} />
        </>
      )}
    </AppHeader>
  );
}

function HeaderMainPreview() {
  return (
    <>
      <Section title="Header / Main (5045:50670)">
        <div className="flex w-302.5 flex-col gap-4 bg-muted/40 p-5">
          {HEADER_ROWS.map((row) => (
            <div key={row} className="flex flex-col gap-1">
              <Caption>{`State=${row}`}</Caption>
              <MainHeader row={row} title="홈" />
            </div>
          ))}
        </div>
      </Section>
      <Section title="Header / Profile (5058:76959)">
        <PreviewMatrix
          rows={["default", "hover", "focus"] as const}
          columns={["Profile"] as const}
          renderCell={(state) => (
            <UserMenu
              {...USER}
              {...USER_MENU_LABELS}
              triggerProps={
                state === "focus"
                  ? { "data-state": "open" }
                  : previewStateProps(state)
              }
            />
          )}
        />
      </Section>
      <Section title="Header / Main / Dropdown (7334:154898)">
        <div className="flex h-44 w-80 justify-end">
          <UserMenu {...USER} {...USER_MENU_LABELS} open modal={false} />
        </div>
      </Section>
      <Section title="Header / Main / Mobile (5084:122374)">
        <div className="flex w-90 flex-col gap-4">
          {(
            ["Log-Out", "Log-In, Alert=True", "Log-In, Alert=False"] as const
          ).map((row) => (
            <div key={row} className="flex flex-col gap-1">
              <Caption>{`State=${row}`}</Caption>
              <MainHeader
                row={row}
                title={row === "Log-Out" ? undefined : "Title"}
              />
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function SubHeaders() {
  const waiting = <Badge variant="blue">답변 대기</Badge>;
  const avatar = (
    <Avatar size="md">
      <AvatarPlaceholder />
    </Avatar>
  );
  const textButton = (
    <Button
      variant="outline-foreground"
      size="sm"
      className="flex-1 tablet:flex-none"
    >
      Text
      <ChevronRight />
    </Button>
  );
  const close = (isDark: boolean) => (
    <Button
      variant="ghost-foreground"
      size="icon-lg"
      aria-label="닫기"
      className={isDark ? "text-background hover:bg-transparent" : undefined}
    >
      <X className="size-4 tablet:size-6" />
    </Button>
  );
  return [
    {
      type: "Default",
      node: <SubHeader title="Title" actions={close(false)} />,
    },
    {
      type: "판매자 Chat",
      node: (
        <SubHeader
          variant="chat"
          title={
            <>
              {waiting}
              <span className="truncate text-base leading-7 font-semibold">
                Title
              </span>
            </>
          }
          actions={
            <p className="flex items-center gap-1.5 self-end text-xs leading-4 tablet:self-auto">
              <span className="text-muted-foreground">상담일</span>
              <span className="text-foreground">2027.05.29 11:00</span>
            </p>
          }
        />
      ),
    },
    {
      type: "구매자 Chat",
      node: (
        <SubHeader
          variant="chat"
          title={
            <span className="flex items-center gap-2">
              {waiting}
              {avatar}
              <span className="truncate text-base leading-none font-semibold">
                Name
              </span>
            </span>
          }
          actions={
            <div className="flex gap-2">
              {textButton}
              <span className="flex flex-1 tablet:hidden">{textButton}</span>
            </div>
          }
        />
      ),
    },
    {
      type: "List",
      node: (
        <SubHeader
          variant="list"
          title={
            <>
              문의 목록
              <Button
                variant="ghost-foreground"
                size="icon-xs"
                aria-label="새로고침"
              >
                <RotateCcw />
              </Button>
            </>
          }
          actions={
            <Button size="sm">
              <Plus />새 문의
            </Button>
          }
        />
      ),
    },
    {
      type: "Download",
      node: (
        <SubHeader
          variant="download"
          title={
            <>
              Title
              <Button
                variant="ghost-foreground"
                size="icon-lg"
                aria-label="다운로드"
                className="text-background hover:bg-transparent"
              >
                <Download className="size-4 tablet:size-6" />
              </Button>
            </>
          }
          actions={close(true)}
        />
      ),
    },
  ];
}

function SubHeaderPreview() {
  const rows = SubHeaders();
  return (
    <Section title="Header / Sub (5198:110453) · Mobile (6791:55626)">
      <div className="flex flex-col gap-4">
        {rows.map(({ type, node }) => (
          <div key={type} className="flex flex-col gap-1">
            <Caption>{`Type=${type}`}</Caption>
            <div className="w-192.75">{node}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        모바일 모양은 tablet(768) 미만 창에서 확인합니다.
      </p>
    </Section>
  );
}

function SidebarPreview() {
  return (
    <>
      <Section title="Sidebar (5058:76567)">
        {[
          { caption: "Open / Close=False, Guide Button=True", guide: true },
          { caption: "Open / Close=False, Guide Button=False", guide: false },
        ].map(({ caption, guide }) => (
          <div key={caption} className="flex flex-col gap-1">
            <Caption>{caption}</Caption>
            <div className="h-200">
              <SidebarNav
                items={NAV_ITEMS}
                logoAlt="Bigbird"
                navLabel="주 메뉴"
                toggleLabel="사이드바 접기"
                primaryActionLabel="캠페인 등록하기"
                guideLabel={guide ? "이용 가이드" : undefined}
              />
            </div>
          </div>
        ))}
        <div className="flex flex-col gap-1">
          <Caption>Open / Close=True</Caption>
          <div className="h-200">
            <SidebarNav
              isCollapsed
              items={NAV_ITEMS}
              logoAlt="Bigbird"
              navLabel="주 메뉴"
              toggleLabel="사이드바 펼치기"
              primaryActionLabel="캠페인 등록하기"
            />
          </div>
        </div>
      </Section>
      <Section title="Sidebar / Navigation Button (5058:78648)">
        <PreviewMatrix
          rows={["default", "hover", "focus"] as const}
          columns={["Button"] as const}
          renderCell={(state) => (
            <SidebarRailItem
              item={{
                id: state,
                label: "홈",
                icon: House,
                href: "#",
                isActive: state === "focus",
              }}
              {...previewStateProps(state === "hover" ? state : "default")}
            />
          )}
        />
      </Section>
      <Section title="Sidebar Base / Main Item (5052:72938) · Sub Item (5052:73211)">
        <PreviewMatrix
          rows={["default", "hover", "focus"] as const}
          columns={["Chevron=False", "Chevron=True"] as const}
          renderCell={(state, column) => {
            const hasChevron = column === "Chevron=True";
            return (
              <div className="w-52.5">
                <SidebarNavItem
                  item={{
                    id: `${state}-${column}`,
                    label: MENU_ITEM,
                    icon: House,
                    href: "#",
                    isActive: state === "focus" && !hasChevron,
                    isDefaultOpen: state === "focus",
                    subItems: hasChevron
                      ? SUB_ITEMS.map((subItem) => ({
                          ...subItem,
                          isActive: subItem.id === "2",
                        }))
                      : undefined,
                  }}
                  {...previewStateProps(state === "hover" ? state : "default")}
                />
              </div>
            );
          }}
        />
      </Section>
      <Section title="Logo (6706:9360)">
        <img src={logo} alt="Bigbird" className="h-5 w-22.5" />
      </Section>
    </>
  );
}

const DIMMED_DEVICES = [
  ["PC", "w-90 h-50"],
  ["TA", "w-48 h-44"],
  ["MO", "w-22.5 h-37.5"],
] as const;

function DimmedPreview() {
  return (
    <Section title="Dimmed (5084:115872) · 1/4 축소">
      <PreviewMatrix
        rows={["light", "dark"] as const}
        columns={DIMMED_DEVICES.map(([device]) => device)}
        rowLabel={(tone) => (tone === "light" ? "Light" : "Dark")}
        renderCell={(tone, device) => {
          const size =
            DIMMED_DEVICES.find(([name]) => name === device)?.[1] ?? "";
          return (
            <div className={`relative overflow-hidden border ${size}`}>
              <Dimmed tone={tone} className="absolute z-auto" />
            </div>
          );
        }}
      />
    </Section>
  );
}

function AlertListPreview() {
  const itemCell = (
    type: AlertListItemData["type"],
    isRead: boolean,
  ): ComponentProps<typeof AlertListItem>["item"] => ({
    ...(ALERT_ITEMS.find((item) => item.type === type) ?? ALERT_ITEMS[0]!),
    isRead,
  });
  return (
    <>
      <Section title="Alert List Base / Card Item (7318:173646)">
        <PreviewMatrix
          rows={["default", "disabled"] as const}
          columns={["Success", "Destructive"] as const}
          renderCell={(state, column) => (
            <AlertListItem
              className="w-97"
              item={itemCell(
                column === "Success" ? "success" : "destructive",
                state === "disabled",
              )}
            />
          )}
        />
      </Section>
      <Section title="Alert List (7318:174033)">
        <div className="flex flex-col gap-1">
          <Caption>State=Default</Caption>
          <AlertList
            title="알림"
            closeLabel="닫기"
            items={ALERT_ITEMS}
            emptyTitle="새로운 알림 없음"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Caption>State=Empty</Caption>
          <AlertList
            title="알림"
            closeLabel="닫기"
            items={[]}
            emptyTitle="새로운 알림 없음"
            emptyDescription={
              "서비스 이용 중 발생한 주요 알림을 여기에\n서 확인할 수 있어요."
            }
          />
        </div>
      </Section>
    </>
  );
}

export function AppShellSection() {
  return (
    <>
      <HeaderMainPreview />
      <SubHeaderPreview />
      <SidebarPreview />
      <DimmedPreview />
      <AlertListPreview />
    </>
  );
}
