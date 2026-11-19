import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  changeLanguage,
  DEFAULT_LANGUAGE,
  registerLanguageLoader,
} from "@/shared/i18n";

import { GuideLanguageButtons } from "./GuideLanguageButtons";

const originalMatchMedia = window.matchMedia;

// jsdom 에는 matchMedia 가 없어 tablet 미만(드로어)으로 읽히므로, 메뉴로 열리는 tablet 이상으로 고정함.
beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: true,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

afterEach(async () => {
  window.matchMedia = originalMatchMedia;
  await act(() => changeLanguage(DEFAULT_LANGUAGE));
});

function renderButtons(
  placement: "header" | "sidebar",
  onClickGuide = vi.fn(),
) {
  render(
    <GuideLanguageButtons placement={placement} onClickGuide={onClickGuide} />,
  );
  return onClickGuide;
}

describe("GuideLanguageButtons", () => {
  it("이용 가이드를 누르면 콜백을 부른다", async () => {
    const user = userEvent.setup();
    const onClickGuide = renderButtons("header");
    await user.click(screen.getByRole("button", { name: "이용 가이드" }));
    expect(onClickGuide).toHaveBeenCalledTimes(1);
  });

  it("언어 항목은 자국어 이름과 현재 언어로 번역한 이름을 함께 보인다", async () => {
    const user = userEvent.setup();
    renderButtons("header");
    await user.click(screen.getByRole("button", { name: "언어 선택, KO" }));
    expect(
      screen.getAllByRole("menuitemradio").map((item) => item.textContent),
    ).toEqual([
      "한국어 (한국어)",
      "English (영어)",
      "日本語 (일본어)",
      "简体中文 (중국어-간체)",
    ]);
  });

  it("항목을 고르면 그 언어로 바꾼다", async () => {
    const user = userEvent.setup();
    registerLanguageLoader(vi.fn().mockResolvedValue({}));
    renderButtons("header");
    await user.click(screen.getByRole("button", { name: "언어 선택, KO" }));
    await user.click(
      screen.getByRole("menuitemradio", { name: "English (영어)" }),
    );
    expect(
      await screen.findByRole("button", { name: /, EN$/ }),
    ).toBeInTheDocument();
  });

  it.each([
    ["header", "bottom"],
    ["sidebar", "top"],
  ] as const)("%s에서는 메뉴를 %s 쪽으로 연다", async (placement, side) => {
    const user = userEvent.setup();
    renderButtons(placement);
    await user.click(screen.getByRole("button", { name: "언어 선택, KO" }));
    expect(screen.getByRole("menu")).toHaveAttribute("data-side", side);
  });
});
