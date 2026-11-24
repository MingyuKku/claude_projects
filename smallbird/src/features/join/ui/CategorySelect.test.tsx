import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";

import { memberApi } from "@/shared/api";

import { CategorySelect } from "./CategorySelect";

import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  memberApi: { get: vi.fn(), post: vi.fn() },
}));

const get = vi.mocked(memberApi.get);

function stubMobile(isMobile: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: isMobile,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function renderSelect(onChangeCategory = vi.fn()) {
  render(
    // 분류 목록은 세션 캐시라 테스트마다 새 캐시를 줌.
    <SWRConfig value={{ provider: () => new Map() }}>
      <CategorySelect value={null} onChangeCategory={onChangeCategory} />
      <button type="button">바깥</button>
    </SWRConfig>,
  );
  return { onChangeCategory };
}

describe("CategorySelect", () => {
  beforeEach(() => {
    get.mockReset();
    get.mockResolvedValue({
      category: [
        { id: 1, name: "패션" },
        { id: 2, name: "뷰티" },
      ],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("태블릿 이상에서는 드롭다운으로 고르고 닫힌다", async () => {
    stubMobile(false);
    const user = userEvent.setup();
    const { onChangeCategory } = renderSelect();

    await user.click(screen.getByRole("button", { name: /대분류/ }));
    await user.click(await screen.findByRole("option", { name: "뷰티" }));

    expect(onChangeCategory).toHaveBeenCalledWith("2");
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("드롭다운은 바깥을 누르거나 Escape를 누르면 닫힌다", async () => {
    stubMobile(false);
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole("button", { name: /대분류/ }));
    await screen.findByRole("option", { name: "패션" });
    await user.click(screen.getByRole("button", { name: "바깥" }));
    expect(screen.queryByRole("option")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /대분류/ }));
    await screen.findByRole("option", { name: "패션" });
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("모바일에서는 바텀시트로 고르고 닫힌다", async () => {
    stubMobile(true);
    const user = userEvent.setup();
    const { onChangeCategory } = renderSelect();

    await user.click(screen.getByRole("button", { name: /대분류/ }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "패션" }));

    expect(onChangeCategory).toHaveBeenCalledWith("1");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
