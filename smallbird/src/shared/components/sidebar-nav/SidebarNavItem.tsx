import { ChevronDown } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Spinner } from "@/shared/ui/spinner";

import type { LucideIcon } from "lucide-react";
import type { ComponentProps, ComponentType, HTMLAttributes } from "react";

// Figma Sidebar Base / Main Item(5052:72938)·Sub Item(5052:73211)·Sidebar / Navigation Button(5058:78648).
// Figma의 Focus 상태는 현재 페이지(aria-current="page").
// 링크 컴포넌트가 이동 중인 링크에 data-pending을 달면 아이콘 자리(하위 메뉴는 이름 오른쪽)에 스피너를 보여 줌.
// 시안이 없어 레이아웃이 변하지 않는 자리에 둠. 이동 중 상태는 링크의 aria-busy로 알리므로 스피너는 읽지 않음.
export interface SidebarLinkProps extends ComponentProps<"a"> {
  href: string;
  // 메뉴 항목의 id. 링크 컴포넌트가 항목별 동작(예: 로그인 안내)을 정할 때 씀.
  navId?: string;
}

export type SidebarLinkComponent = ComponentType<SidebarLinkProps>;

// href가 없는 항목이 이동하지 않는 자리표시 링크로 남도록 하는 값
const FALLBACK_HREF = "#";

export interface SidebarNavSubItemData {
  id: string;
  label: string;
  // 화면이 아직 없는 하위 메뉴는 목적지 없이 두고, 링크 컴포넌트가 비활성으로 그림.
  href?: string;
  isActive?: boolean;
}

export interface SidebarNavItemData {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  isActive?: boolean;
  // 하위 메뉴가 있으면 펼침 그룹으로 표시함.
  subItems?: SidebarNavSubItemData[];
  isDefaultOpen?: boolean;
  // 하위 화면 연결 전에도 그룹 메뉴의 펼침 표시를 유지함.
  hasSubItems?: boolean;
}

interface SidebarNavItemProps extends HTMLAttributes<HTMLElement> {
  item: SidebarNavItemData;
  linkAs?: SidebarLinkComponent;
}

const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

const mainRowClass = cn(
  "flex min-h-10 w-full items-center gap-3 rounded-md px-3 py-2 text-sm leading-5 font-medium text-foreground transition-colors hover:bg-muted aria-[current=page]:bg-muted aria-[current=page]:text-primary",
  FOCUS_RING,
);

// 아이콘과 같은 자리에 겹쳐 두고 이동 중에만 바꿔 보임.
function NavIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <>
      <Icon className="size-4 shrink-0 in-data-pending:hidden" />
      <Spinner aria-hidden className="hidden shrink-0 in-data-pending:block" />
    </>
  );
}

// 드롭다운 아이콘은 16px 아이콘 + 2px 여백 = 20×20 영역(Figma Icon Button 5052:72817). 행의 오른쪽 여백 12px(px-3)과 함께
// 하위 메뉴가 있는 모든 행에서 같은 자리에 정렬됨.
function NavChevron({ className }: { className?: string }) {
  return (
    <span className="shrink-0 rounded-md p-0.5">
      <ChevronDown className={cn("size-4", className)} />
    </span>
  );
}

function DefaultLink({ children, navId, ...props }: SidebarLinkProps) {
  return (
    <a data-nav-id={navId} {...props}>
      {children}
    </a>
  );
}

export function SidebarNavItem({
  item,
  linkAs: Link = DefaultLink,
  className,
  ...props
}: SidebarNavItemProps) {
  const Icon = item.icon;

  if (!item.subItems?.length) {
    return (
      <Link
        href={item.href ?? FALLBACK_HREF}
        navId={item.id}
        aria-current={item.isActive ? "page" : undefined}
        className={cn(mainRowClass, className)}
        {...props}
      >
        <NavIcon icon={Icon} />
        <span className="flex-1 truncate">{item.label}</span>
        {item.hasSubItems && <NavChevron />}
      </Link>
    );
  }

  return (
    <details open={item.isDefaultOpen} className="group/nav-item">
      <summary
        className={cn(
          mainRowClass,
          "cursor-pointer list-none [&::-webkit-details-marker]:hidden",
          className,
        )}
        {...props}
      >
        <Icon className="size-4 shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        <NavChevron className="transition-transform group-open/nav-item:rotate-180" />
      </summary>
      <div className="py-1.5 pl-5">
        <ul className="flex flex-col border-l pl-3">
          {item.subItems.map((subItem) => (
            <li key={subItem.id}>
              <Link
                href={subItem.href ?? FALLBACK_HREF}
                navId={subItem.id}
                aria-current={subItem.isActive ? "page" : undefined}
                className={cn(
                  "flex min-w-32 items-center gap-1.5 rounded-sm p-1.5 text-sm leading-5 text-sidebar-foreground transition-colors hover:bg-muted aria-[current=page]:bg-muted aria-[current=page]:text-primary",
                  FOCUS_RING,
                )}
              >
                <span className="truncate">{subItem.label}</span>
                <Spinner
                  aria-hidden
                  className="hidden size-3.5 shrink-0 in-data-pending:block"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

// 레일(접힌 사이드바)의 아이콘 버튼. 하위 메뉴가 있는 항목은 대표 href로 이동함.
export function SidebarRailItem({
  item,
  linkAs: Link = DefaultLink,
  className,
  ...props
}: SidebarNavItemProps) {
  const Icon = item.icon;
  const isActive =
    item.isActive || item.subItems?.some((subItem) => subItem.isActive);
  return (
    <Link
      href={item.href ?? item.subItems?.[0]?.href ?? FALLBACK_HREF}
      navId={item.id}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent aria-[current=page]:bg-accent aria-[current=page]:text-primary",
        FOCUS_RING,
        className,
      )}
      {...props}
    >
      <NavIcon icon={Icon} />
    </Link>
  );
}
