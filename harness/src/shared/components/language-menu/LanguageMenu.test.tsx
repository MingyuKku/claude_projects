import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LanguageMenu } from "./LanguageMenu";

const OPTIONS = [
  { value: "ko", code: "KO", label: "한국어 (한국어)" },
  { value: "en", code: "EN", label: "English (영어)" },
];

function renderMenu(onChangeLanguage = vi.fn()) {
  render(
    <LanguageMenu
      value="ko"
      options={OPTIONS}
      menuLabel="언어 선택"
      onChangeLanguage={onChangeLanguage}
    />,
  );
  return onChangeLanguage;
}

describe("LanguageMenu", () => {
  it("트리거의 접근성 이름에 현재 언어 코드를 붙인다", () => {
    renderMenu();
    expect(
      screen.getByRole("button", { name: "언어 선택, KO" }),
    ).toBeInTheDocument();
  });

  it("현재 언어에 체크를 표시한다", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole("button", { name: "언어 선택, KO" }));
    expect(
      screen.getByRole("menuitemradio", { name: "한국어 (한국어)" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("menuitemradio", { name: "English (영어)" }),
    ).toHaveAttribute("aria-checked", "false");
  });

  it("항목을 고르면 그 언어로 바꾸고 메뉴를 닫는다", async () => {
    const user = userEvent.setup();
    const onChangeLanguage = renderMenu();
    await user.click(screen.getByRole("button", { name: "언어 선택, KO" }));
    await user.click(
      screen.getByRole("menuitemradio", { name: "English (영어)" }),
    );
    expect(onChangeLanguage).toHaveBeenCalledWith("en");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  describe("isDrawerOnMobile", () => {
    const originalMatchMedia = window.matchMedia;

    // vaul 이 쓰는 포인터 캡처를 jsdom 은 구현하지 않음.
    Element.prototype.setPointerCapture = () => {};
    Element.prototype.releasePointerCapture = () => {};

    function mockTabletUp(matches: boolean) {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));
    }

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    function renderDrawerMenu() {
      const onChangeLanguage = vi.fn();
      render(
        <LanguageMenu
          value="ko"
          options={OPTIONS}
          menuLabel="언어 선택"
          onChangeLanguage={onChangeLanguage}
          isDrawerOnMobile
        />,
      );
      return onChangeLanguage;
    }

    it("모바일 폭에서는 메뉴 대신 드로어로 열고 현재 언어를 표시한다", async () => {
      mockTabletUp(false);
      const user = userEvent.setup();
      renderDrawerMenu();
      await user.click(screen.getByRole("button", { name: "언어 선택, KO" }));
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(
        screen.getByRole("dialog", { name: "언어 선택" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "한국어 (한국어)" }),
      ).toHaveAttribute("aria-current", "true");
    });

    it("드로어에서 항목을 고르면 그 언어로 바꾸고 닫는다", async () => {
      mockTabletUp(false);
      const user = userEvent.setup();
      const onChangeLanguage = renderDrawerMenu();
      await user.click(screen.getByRole("button", { name: "언어 선택, KO" }));
      await user.click(screen.getByRole("button", { name: "English (영어)" }));
      expect(onChangeLanguage).toHaveBeenCalledWith("en");
    });

    it("tablet 이상에서는 드로어 옵션이어도 메뉴로 연다", async () => {
      mockTabletUp(true);
      const user = userEvent.setup();
      renderDrawerMenu();
      await user.click(screen.getByRole("button", { name: "언어 선택, KO" }));
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });
  });
});
