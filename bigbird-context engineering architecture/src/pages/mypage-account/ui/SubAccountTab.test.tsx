import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { toast } from "sonner";

import { SubAccountTab } from "./SubAccountTab";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

beforeEach(() => {
  vi.mocked(toast).mockReset();
  // 표(PC·TAB) 배치로 렌더하려고 태블릿 이상으로 흉내 냄.
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("768"),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

afterEach(() => {
  Reflect.deleteProperty(window, "matchMedia");
});

function setup(permissionAccountIdx: number | null = null) {
  const onOpenPermission = vi.fn();
  render(
    <MemoryRouter>
      <SubAccountTab
        layout="tablet"
        isCreateOpen={false}
        onOpenCreate={vi.fn()}
        onCloseCreate={vi.fn()}
        permissionAccountIdx={permissionAccountIdx}
        onOpenPermission={onOpenPermission}
        onClosePermission={vi.fn()}
      />
    </MemoryRouter>,
  );
  return { user: userEvent.setup(), onOpenPermission };
}

describe("SubAccountTab 삭제", () => {
  it("삭제 버튼은 확인 알럿을 열고, 확정하면 실제 삭제 대신 준비 중으로 안내한다", async () => {
    const { user } = setup();
    const row = within(screen.getByRole("table")).getAllByRole("row")[1]!;
    await user.click(within(row).getByRole("button", { name: "삭제" }));

    const dialog = screen.getByRole("alertdialog", { name: "Sub ID 삭제" });
    expect(dialog).toHaveTextContent("‘sub01’를 삭제하시겠습니까?");

    await user.click(within(dialog).getByRole("button", { name: "삭제" }));
    expect(toast).toHaveBeenCalledWith("준비 중인 기능입니다.");
    expect(screen.queryByRole("alertdialog")).toBeNull();
    // 목록은 그대로임(값을 바꾸지 않음).
    expect(screen.getByText("sub01")).toBeInTheDocument();
  });

  it("알럿에서 취소하면 아무 안내도 하지 않는다", async () => {
    const { user } = setup();
    const row = within(screen.getByRole("table")).getAllByRole("row")[1]!;
    await user.click(within(row).getByRole("button", { name: "삭제" }));
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(toast).not.toHaveBeenCalled();
  });
});

describe("SubAccountTab 권한 부여", () => {
  it("권한 부여 버튼은 해당 Sub ID로 열기를 요청한다", async () => {
    const { user, onOpenPermission } = setup();
    const row = within(screen.getByRole("table")).getAllByRole("row")[1]!;
    await user.click(within(row).getByRole("button", { name: "권한 부여" }));
    expect(onOpenPermission).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: "sub01" }),
    );
  });

  it("열려 있지 않으면 권한부여·캠페인 할당 섹션이 없다", () => {
    setup();
    expect(
      screen.queryByRole("heading", { name: "Sub ID 권한부여" }),
    ).toBeNull();
  });

  it("열려 있으면 두 섹션을 순서대로 보이고, 스위치는 준비 중 안내 후 값을 유지한다", async () => {
    const { user } = setup(9000);
    const headings = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);
    expect(headings).toEqual(["Sub ID 권한부여", "Sub ID 캠페인 할당"]);

    const toggle = screen.getAllByRole("switch")[0]!;
    const before = toggle.getAttribute("aria-checked");
    await user.click(toggle);
    expect(toast).toHaveBeenCalledWith("준비 중인 기능입니다.");
    expect(toggle.getAttribute("aria-checked")).toBe(before);
  });
});

describe("SubAccountTab 빌드(stage·prod)", () => {
  beforeEach(() => vi.stubEnv("DEV", false));
  afterEach(() => vi.unstubAllEnvs());

  it("목록 자리에 준비 중을 보이고 생성 버튼은 남긴다", async () => {
    const onOpenCreate = vi.fn();
    render(
      <MemoryRouter>
        <SubAccountTab
          layout="tablet"
          isCreateOpen={false}
          onOpenCreate={onOpenCreate}
          onCloseCreate={vi.fn()}
          permissionAccountIdx={9000}
          onOpenPermission={vi.fn()}
          onClosePermission={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("준비 중인 기능입니다.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
    // 권한 부여 섹션도 목이라 subId가 있어도 열지 않음.
    expect(screen.queryByText("Sub ID 권한부여")).toBeNull();

    const [createButton] = screen.getAllByRole("button", {
      name: "Sub ID 생성",
    });
    await userEvent.setup().click(createButton!);
    expect(onOpenCreate).toHaveBeenCalled();
  });
});
