import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DatePicker } from "./DatePicker";

// jsdom에는 Radix·vaul이 쓰는 브라우저 API가 없음.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

// jsdom에는 matchMedia가 없어 화면 폭을 흉내 냄.
function stubWidth(isTabletUp: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: query === "(min-width: 768px)" ? isTabletUp : false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 10, 15, 12) });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function renderPicker(props: { isSheetOnMobile?: boolean } = {}) {
  const onValueChange = vi.fn();
  render(
    <DatePicker
      label="시작일"
      placeholder="날짜 선택"
      onValueChange={onValueChange}
      {...props}
    />,
  );
  return { onValueChange, user: userEvent.setup() };
}

describe("DatePicker", () => {
  it("기본은 어느 폭에서든 팝오버로 열고 고른 날짜를 넘긴다", async () => {
    stubWidth(false);
    const { onValueChange, user } = renderPicker();

    await user.click(screen.getByRole("button", { name: /시작일/ }));
    // 시트가 아니라 팝오버라 캘린더가 바로 보인다.
    await user.click(await screen.findByRole("button", { name: /20일/ }));

    expect(document.querySelector("[data-vaul-drawer]")).toBeNull();
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 10, 20));
  });

  it("isSheetOnMobile이면 MO에서는 아래에서 올라오는 시트로 열고 날짜를 고르면 닫힌다", async () => {
    stubWidth(false);
    const { onValueChange, user } = renderPicker({ isSheetOnMobile: true });

    await user.click(screen.getByRole("button", { name: /시작일/ }));
    const sheet = await screen.findByRole("dialog");
    expect(sheet).toHaveTextContent("시작일");
    expect(document.querySelector("[data-vaul-drawer]")).not.toBeNull();
    await user.click(await screen.findByRole("button", { name: /20일/ }));

    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 10, 20));
    await vi.waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("isSheetOnMobile이어도 TAB 이상에서는 팝오버로 연다", async () => {
    stubWidth(true);
    const { user } = renderPicker({ isSheetOnMobile: true });

    await user.click(screen.getByRole("button", { name: /시작일/ }));
    await screen.findByRole("button", { name: /20일/ });

    expect(document.querySelector("[data-vaul-drawer]")).toBeNull();
  });
});
