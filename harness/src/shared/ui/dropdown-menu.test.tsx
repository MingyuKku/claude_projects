import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
