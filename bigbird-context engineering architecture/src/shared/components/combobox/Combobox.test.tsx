import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { Combobox } from "./Combobox";

// cmdk 가 쓰는 브라우저 API 가 jsdom 에 없어 이 파일에서만 채움.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView = () => {};
});

const OPTIONS = [
  { value: "seoul-1", label: "서울" },
  { value: "seoul-2", label: "서울" },
  { value: "busan", label: "부산" },
];

function renderCombobox(onValueChange = vi.fn()) {
  render(
    <Combobox
      options={OPTIONS}
      onValueChange={onValueChange}
      placeholder="지역 선택"
      searchPlaceholder="검색"
      emptyText="결과 없음"
    />,
  );
  return onValueChange;
}

describe("Combobox", () => {
  it("라벨이 같은 옵션도 누른 항목의 value 가 선택된다", async () => {
    const user = userEvent.setup();
    const onValueChange = renderCombobox();

    await user.click(screen.getByRole("combobox"));
    const [, secondSeoul] = screen.getAllByRole("option", { name: "서울" });
    expect(secondSeoul).toBeDefined();
    await user.click(secondSeoul as HTMLElement);

    expect(onValueChange).toHaveBeenCalledWith("seoul-2");
  });

  it("방향키로 라벨이 같은 두 번째 옵션을 고를 수 있다", async () => {
    const user = userEvent.setup();
    const onValueChange = renderCombobox();

    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onValueChange).toHaveBeenCalledWith("seoul-2");
  });

  it("라벨로 검색한다", async () => {
    const user = userEvent.setup();
    renderCombobox();

    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByPlaceholderText("검색"), "부산");

    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option", { name: "부산" })).toBeInTheDocument();
  });
});
