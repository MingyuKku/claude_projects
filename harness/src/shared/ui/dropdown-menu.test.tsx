import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

function renderMenu() {
  render(
    <DropdownMenu>
      <DropdownMenuTrigger>메뉴</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>항목</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  return screen.getByRole("button", { name: "메뉴" });
}

describe("DropdownMenu", () => {
  it("마우스는 누르는 순간(pointerdown) 열린다", () => {
    const trigger = renderMenu();
    fireEvent.pointerDown(trigger, { pointerType: "mouse", button: 0 });
    expect(screen.getByRole("menuitem", { name: "항목" })).toBeInTheDocument();
  });

  it("터치는 손가락을 대기만 해서는 열리지 않고 탭(click)으로 열린다", () => {
    const trigger = renderMenu();
    fireEvent.pointerDown(trigger, { pointerType: "touch", button: 0 });
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.getByRole("menuitem", { name: "항목" })).toBeInTheDocument();
  });

  it("터치로 스크롤하면(click 없음) 열리지 않는다", () => {
    const trigger = renderMenu();
    fireEvent.pointerDown(trigger, { pointerType: "touch", button: 0 });
    fireEvent.pointerCancel(trigger, { pointerType: "touch" });
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
  });

  it("키보드 Enter로 열린다", () => {
    const trigger = renderMenu();
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(screen.getByRole("menuitem", { name: "항목" })).toBeInTheDocument();
  });
});

describe("DropdownMenuRadioItem 선택 표시 위치", () => {
  function renderRadioMenu(indicatorPosition?: "start" | "end") {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>메뉴</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="a">
            <DropdownMenuRadioItem value="a" indicatorPosition={indicatorPosition}>
              가
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="b" indicatorPosition={indicatorPosition}>
              나
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    return screen.getByRole("menuitemradio", { name: "가" });
  }

  it("기본은 왼쪽 점이고 항목에 왼쪽 여백을 둔다", () => {
    const selected = renderRadioMenu();
    expect(selected).toHaveAttribute("aria-checked", "true");
    expect(selected).toHaveClass("pl-8.5");
    expect(selected.querySelector("svg.lucide-circle")).toBeInTheDocument();
  });

  it("end이면 선택된 항목에만 오른쪽 체크를 그리고 왼쪽 여백을 두지 않는다", () => {
    const selected = renderRadioMenu("end");
    expect(selected).not.toHaveClass("pl-8.5");
    expect(selected.querySelector("svg.lucide-check")).toBeInTheDocument();
    expect(
      screen
        .getByRole("menuitemradio", { name: "나" })
        .querySelector("svg"),
    ).not.toBeInTheDocument();
  });
});
