import { ChevronDown } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { LucideIcon } from "lucide-react";
import type { ComponentProps, ComponentType, HTMLAttributes } from "react";

// Figma Sidebar Base / Main Item(5052:72938)·Sub Item(5052:73211)·Sidebar / Navigation Button(5058:78648).
// Figma의 Focus 상태는 현재 페이지(aria-current="page").
export interface SidebarLinkProps extends ComponentProps<"a"> {
  href: string;
}

export type SidebarLinkComponent = ComponentType<SidebarLinkProps>;

// href가 없는 항목이 이동하지 않는 자리표시 링크로 남도록 하는 값
const FALLBACK_HREF = "#";

export interface SidebarNavSubItemData {
  id: string;
  label: string;
  href: string;
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

function DefaultLink({ children, ...props }: SidebarLinkProps) {
  return <a {...props}>{children}</a>;
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
        aria-current={item.isActive ? "page" : undefined}
        className={cn(mainRowClass, className)}
        {...props}
      >
        <Icon className="size-4 shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        {item.hasSubItems && <ChevronDown className="size-4" />}
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
        <span className="rounded-md p-0.5">
          <ChevronDown className="size-4 transition-transform group-open/nav-item:rotate-180" />
        </span>
      </summary>
      <div className="py-1.5 pl-5">
        <ul className="flex flex-col border-l pl-3">
          {item.subItems.map((subItem) => (
            <li key={subItem.id}>
              <Link
                href={subItem.href}
                aria-current={subItem.isActive ? "page" : undefined}
                className={cn(
                  "block min-w-32 truncate rounded-sm p-1.5 text-sm leading-5 text-sidebar-foreground aria-[current=page]:bg-muted aria-[current=page]:text-primary",
                  FOCUS_RING,
                )}
              >
                {subItem.label}
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
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent aria-[current=page]:bg-accent aria-[current=page]:text-primary",
        FOCUS_RING,
        className,
      )}
      {...props}
    >
      <Icon className="size-4" />
    </Link>
  );
}
