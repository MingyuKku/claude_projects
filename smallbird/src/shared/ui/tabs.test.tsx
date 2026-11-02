import { render, screen, waitFor } from "@testing-library/react";
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

describe("TabsList 선택 표시", () => {
  function indicator(container: HTMLElement) {
    return container.querySelector<HTMLElement>('[data-slot="tabs-indicator"]')!;
  }

  // jsdom은 레이아웃이 없어 탭마다 위치를 정해 줌(offsetLeft·offsetWidth).
  function mockLayout() {
    const offsets: Record<string, number> = { 첫째: 0, 둘째: 120 };
    vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockImplementation(
      function (this: HTMLElement) {
        return offsets[this.textContent ?? ""] ?? 0;
      },
    );
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(100);
  }

  afterEach(() => vi.restoreAllMocks())

  it("선택된 탭의 위치·크기로 표시 요소를 놓고 스크린리더에는 숨긴다", () => {
    mockLayout();
    const { container } = render(
      <Tabs defaultValue="a">
        <TabsList variant="line">
          <TabsTrigger value="a">첫째</TabsTrigger>
          <TabsTrigger value="b">둘째</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    const element = indicator(container);
    expect(element).toHaveAttribute("aria-hidden", "true");
    expect(element).toHaveAttribute("data-measured");
    expect(element.style.getPropertyValue("--tab-x")).toBe("0px");
    expect(element.style.getPropertyValue("--tab-w")).toBe("100px");
  });

  it("탭을 바꾸면 새 탭의 위치로 옮겨 간다", async () => {
    mockLayout();
    const user = userEvent.setup();
    const { container } = render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">첫째</TabsTrigger>
          <TabsTrigger value="b">둘째</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    await user.click(screen.getByRole("tab", { name: "둘째" }));
    await waitFor(() =>
      expect(indicator(container).style.getPropertyValue("--tab-x")).toBe(
        "120px",
      ),
    );
  });

  it("선택된 탭이 없으면 표시 요소를 숨긴다", () => {
    const { container } = render(
      <Tabs value="none">
        <TabsList>
          <TabsTrigger value="a">첫째</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(indicator(container)).not.toHaveAttribute("data-measured");
  });
});
