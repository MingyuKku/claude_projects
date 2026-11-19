import { render, screen } from "@testing-library/react";
import { Home } from "lucide-react";
import { describe, expect, it } from "vitest";

import { SidebarNav } from "./SidebarNav";

const ITEMS = [{ id: "home", label: "홈", icon: Home, href: "/" }];

function renderSidebar(isCollapsed: boolean) {
  render(
    <SidebarNav
      items={ITEMS}
      logoAlt="빅버드"
      navLabel="주 메뉴"
      toggleLabel="메뉴 접기"
      isCollapsed={isCollapsed}
      footerActions={<button type="button">이용 가이드</button>}
      footerSwitch={<div>전환 탭</div>}
    />,
  );
}

describe("SidebarNav 하단", () => {
  it("펼친 상태에서는 버튼 줄과 전환 탭을 보인다", () => {
    renderSidebar(false);
    expect(
      screen.getByRole("button", { name: "이용 가이드" }),
    ).toBeInTheDocument();
    expect(screen.getByText("전환 탭")).toBeInTheDocument();
  });

  it("접힌 레일에서는 숨긴다", () => {
    renderSidebar(true);
    expect(
      screen.queryByRole("button", { name: "이용 가이드" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("전환 탭")).not.toBeInTheDocument();
  });
});
