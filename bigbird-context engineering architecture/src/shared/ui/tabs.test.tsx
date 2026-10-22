import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tabs, TabsList, TabsTrigger } from "./tabs";

function setup() {
  render(
    <Tabs defaultValue="a">
      <TabsList variant="line">
        <TabsTrigger value="a">첫째</TabsTrigger>
        <TabsTrigger value="b">둘째</TabsTrigger>
      </TabsList>
    </Tabs>,
  );
  return userEvent.setup();
}

describe("TabsTrigger 포커스 링", () => {
  it("마우스로 고른 탭에는 키보드 포커스 표시를 숨긴다", async () => {
    const user = setup();
    await user.click(screen.getByRole("tab", { name: "둘째" }));
    expect(screen.getByRole("tab", { name: "둘째" })).toHaveAttribute(
      "data-pointer-focus",
    );
  });

  it("키보드로 옮기면 표시를 숨기지 않는다", async () => {
    const user = setup();
    await user.click(screen.getByRole("tab", { name: "첫째" }));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "첫째" })).not.toHaveAttribute(
      "data-pointer-focus",
    );
    expect(screen.getByRole("tab", { name: "둘째" })).not.toHaveAttribute(
      "data-pointer-focus",
    );
  });

  it("탭을 벗어나면 다시 키보드 포커스에 링이 보이게 되돌린다", async () => {
    const user = setup();
    await user.click(screen.getByRole("tab", { name: "첫째" }));
    await user.tab();
    expect(screen.getByRole("tab", { name: "첫째" })).not.toHaveAttribute(
      "data-pointer-focus",
    );
  });
});
