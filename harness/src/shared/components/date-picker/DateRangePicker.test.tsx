import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DateRangePicker } from "./DateRangePicker";

// jsdom에는 matchMedia가 없어 화면 폭을 흉내 냄. 기본은 TAB 이상(팝오버), MO 시트 테스트만 좁은 폭으로 바꿈.
function stubWidth(isTabletUp: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: query === "(min-width: 768px)" ? isTabletUp : false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  );
}

beforeEach(() => stubWidth(true));
afterEach(() => vi.unstubAllGlobals());

describe("DateRangePicker", () => {
  it("값이 없으면 안내 문구를, 있으면 시작일 ~ 종료일을 보여 준다", () => {
    const { rerender } = render(
      <DateRangePicker
        placeholder="날짜를 선택하세요."
        onValueChange={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: "날짜를 선택하세요." }),
    ).toBeInTheDocument();
    rerender(
      <DateRangePicker
        placeholder="날짜를 선택하세요."
        value={{ from: new Date(2026, 10, 1), to: new Date(2026, 10, 7) }}
        onValueChange={() => {}}
      />,
    );
    expect(screen.getByRole("button")).toHaveTextContent("~");
  });

  it("시작일과 종료일을 차례로 고르면 범위를 돌려주고 달력을 닫는다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        placeholder="날짜를 선택하세요."
        value={{ from: new Date(2026, 10, 1), to: undefined }}
        onValueChange={onValueChange}
      />,
    );
    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("button", { name: /11월 7일/ }));
    const range = onValueChange.mock.lastCall?.[0];
    expect(range.from).toEqual(new Date(2026, 10, 1));
    expect(range.to).toEqual(new Date(2026, 10, 7));
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("MO 폭에서는 한 달 달력을 아래 시트로 연다", async () => {
    stubWidth(false);
    const user = userEvent.setup();
    render(
      <DateRangePicker
        placeholder="날짜를 선택하세요."
        onValueChange={() => {}}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "날짜를 선택하세요." }),
    );
    const sheet = await screen.findByRole("dialog");
    expect(sheet.querySelectorAll("[role=grid]")).toHaveLength(1);
  });
});
