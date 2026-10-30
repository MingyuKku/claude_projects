import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

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

  it("MO 폭에서는 아래 시트로 열리고 검색할 수 있다", async () => {
    stubWidth(false);
    const user = userEvent.setup();
    renderCombobox();
    await user.click(screen.getByRole("combobox"));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("검색")).toBeInTheDocument();
  });

  it("isSearchable이 꺼지면 검색 입력 없이 옵션만 보인다", async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        options={OPTIONS}
        isSearchable={false}
        placeholder="지역 선택"
        searchPlaceholder="검색"
        emptyText="결과 없음"
      />,
    );

    await user.click(screen.getByRole("combobox"));

    expect(screen.queryByPlaceholderText("검색")).toBeNull();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });
});
