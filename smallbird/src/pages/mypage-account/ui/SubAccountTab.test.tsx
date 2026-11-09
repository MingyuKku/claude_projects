import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { toast } from "sonner";
import { SWRConfig } from "swr";

import { ApiError, serverApiV3 } from "@/shared/api";

import { SubAccountTab } from "./SubAccountTab";

import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApiV3: { get: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

const SUB_LIST = {
  sub: [
    { idx: 9000, identifier: "sub01", name: "김담당", email: "a@b.c" },
    { idx: 9001, identifier: "sub02", name: "이마케팅", email: "d@e.f" },
  ],
  pagingInfo: { page: 1, size: 8, totalCount: 2, totalPage: 1 },
};

let isPurchaserQuestionAccess = false;

function respond(path: string) {
  if (path === "/mypage/account/sub") return Promise.resolve(SUB_LIST);
  if (path.startsWith("/mypage/account/authorization/")) {
    const accountIdx = Number(path.split("/").at(-1));
    return Promise.resolve({
      accountIdx,
      isCampaignAccess: false,
      isInfluencerMatchingAccess: false,
      isInfluencerMarketAccess: false,
      isCommerceAccess: false,
      isBigbirdMoneyAccess: true,
      isPurchaserQuestionAccess,
    });
  }
  return Promise.reject(new Error(`unexpected ${path}`));
}

// Radix ScrollArea(패널·약관 본문 스크롤)가 쓰는 브라우저 API가 jsdom에 없어 이 파일에서만 채움.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  isPurchaserQuestionAccess = false;
  vi.mocked(serverApiV3.get)
    .mockReset()
    .mockImplementation(respond as typeof serverApiV3.get);
  vi.mocked(serverApiV3.put).mockReset();
  vi.mocked(serverApiV3.delete).mockReset();
  vi.mocked(toast).mockReset();
  vi.mocked(toast.error).mockReset();
  // 표(PC) 배치로 렌더하려고 모든 미디어 쿼리가 맞는 것으로 흉내 냄.
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: true,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

afterEach(() => {
  Reflect.deleteProperty(window, "matchMedia");
});

const swrCache = { current: new Map() };

interface TabOptions {
  layout?: "desktop" | "tablet" | "mobile";
  panel?: "create" | "permission" | "edit" | null;
  panelAccountIdx?: number | null;
}

function setup({
  layout = "desktop",
  panel = null,
  panelAccountIdx = null,
}: TabOptions = {}) {
  swrCache.current = new Map();
  const handlers = {
    onOpenCreate: vi.fn(),
    onOpenPermission: vi.fn(),
    onOpenEdit: vi.fn(),
    onClosePanel: vi.fn(),
  };
  render(
    <SWRConfig
      value={{ provider: () => swrCache.current, shouldRetryOnError: false }}
    >
      <MemoryRouter>
        <SubAccountTab
          layout={layout}
          panel={panel}
          panelAccountIdx={panelAccountIdx}
          {...handlers}
        />
      </MemoryRouter>
    </SWRConfig>,
  );
  return { user: userEvent.setup(), ...handlers };
}

async function findRow(identifier: string) {
  const cell = await screen.findByText(identifier);
  return cell.closest("tr")!;
}

describe("SubAccountTab 삭제", () => {
  it("확인 알럿에서 삭제하면 서버에서 지우고 목록을 다시 읽는다", async () => {
    vi.mocked(serverApiV3.delete).mockResolvedValue({ result: true });
    const { user } = setup();
    await user.click(
      within(await findRow("sub01")).getByRole("button", { name: "삭제" }),
    );

    const dialog = screen.getByRole("alertdialog", { name: "Sub ID 삭제" });
    expect(dialog).toHaveTextContent("‘sub01’를 삭제하시겠습니까?");
    const listCalls = vi.mocked(serverApiV3.get).mock.calls.length;

    await user.click(within(dialog).getByRole("button", { name: "삭제" }));
    expect(serverApiV3.delete).toHaveBeenCalledWith("/mypage/account/sub/9000");
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Sub ID가 삭제되었습니다."),
    );
    expect(vi.mocked(serverApiV3.get).mock.calls.length).toBeGreaterThan(
      listCalls,
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("열어 둔 권한 부여의 Sub ID를 지우면 패널을 닫는다", async () => {
    vi.mocked(serverApiV3.delete).mockResolvedValue({ result: true });
    const { user, onClosePanel } = setup({
      panel: "permission",
      panelAccountIdx: 9000,
    });
    await user.click(
      within(await findRow("sub01")).getByRole("button", { name: "삭제" }),
    );
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "삭제",
      }),
    );
    await waitFor(() => expect(onClosePanel).toHaveBeenCalled());
  });

  it("삭제가 실패하면 오류로 안내한다", async () => {
    vi.mocked(serverApiV3.delete).mockRejectedValue(
      new ApiError(403, { result: false, reason: "not owned sub account" }),
    );
    const { user } = setup();
    await user.click(
      within(await findRow("sub01")).getByRole("button", { name: "삭제" }),
    );
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "삭제",
      }),
    );
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "저장하지 못했습니다. 다시 시도해 주세요.",
      ),
    );
    expect(toast).not.toHaveBeenCalled();
  });

  it("알럿에서 취소하면 아무 안내도 하지 않는다", async () => {
    const { user } = setup();
    await user.click(
      within(await findRow("sub01")).getByRole("button", { name: "삭제" }),
    );
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(serverApiV3.delete).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
  });
});

describe("SubAccountTab 권한 부여", () => {
  it("권한 부여·수정 버튼은 해당 Sub ID로 열기를 요청한다", async () => {
    const { user, onOpenPermission, onOpenEdit } = setup();
    const row = await findRow("sub01");
    await user.click(within(row).getByRole("button", { name: "권한 부여" }));
    expect(onOpenPermission).toHaveBeenCalledWith(
      expect.objectContaining({ accountIdx: 9000, identifier: "sub01" }),
    );
    await user.click(within(row).getByRole("button", { name: "수정" }));
    expect(onOpenEdit).toHaveBeenCalledWith(
      expect.objectContaining({ accountIdx: 9000, identifier: "sub01" }),
    );
  });

  it("열려 있지 않으면 권한 패널이 없다", async () => {
    setup();
    await screen.findByText("sub01");
    expect(screen.queryByRole("tab", { name: "서비스 권한" })).toBeNull();
  });

  it("목록에 없는 Sub ID는 열지 않는다", async () => {
    setup({ panel: "permission", panelAccountIdx: 1234 });
    await screen.findByText("sub01");
    expect(screen.queryByRole("tab", { name: "서비스 권한" })).toBeNull();
  });

  it("열려 있으면 서비스 권한 6개를 시안 순서대로 그린다", async () => {
    setup({ panel: "permission", panelAccountIdx: 9000 });
    const toggle = await screen.findByRole("switch", {
      name: "구매자 문의 권한",
    });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(serverApiV3.get).toHaveBeenCalledWith(
      "/mypage/account/authorization/9000",
    );
    expect(
      screen.getByRole("tab", { name: "캠페인 할당" }),
    ).toBeInTheDocument();
    const list = screen.getByRole("list", { name: "Sub ID 권한부여" });
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual([
      "캠페인",
      "인플루언서 매칭",
      "인플루언서 마켓",
      "커머스 관리",
      "빅버드 머니",
      "구매자 문의",
    ]);
    expect(
      within(list).getByRole("switch", { name: "빅버드 머니 권한" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("권한 스위치를 바꾸면 바로 저장하고 안내한다", async () => {
    vi.mocked(serverApiV3.put).mockResolvedValue({
      accountIdx: 9000,
      isCampaignAccess: false,
      isInfluencerMatchingAccess: false,
      isInfluencerMarketAccess: false,
      isCommerceAccess: false,
      isBigbirdMoneyAccess: true,
      isPurchaserQuestionAccess: true,
    });
    const { user } = setup({ panel: "permission", panelAccountIdx: 9000 });
    const toggle = await screen.findByRole("switch", {
      name: "구매자 문의 권한",
    });
    await user.click(toggle);
    expect(serverApiV3.put).toHaveBeenCalledWith(
      "/mypage/account/authorization",
      { accountIdx: 9000, isPurchaserQuestionAccess: true },
    );
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        "‘구매자 문의’ 권한이 부여되었습니다.",
      ),
    );
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("저장이 실패하면 원래 값으로 되돌리고 오류로 안내한다", async () => {
    vi.mocked(serverApiV3.put).mockRejectedValue(new ApiError(500, undefined));
    const { user } = setup({ panel: "permission", panelAccountIdx: 9000 });
    const toggle = await screen.findByRole("switch", {
      name: "구매자 문의 권한",
    });
    await user.click(toggle);
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "저장하지 못했습니다. 다시 시도해 주세요.",
      ),
    );
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("캠페인 할당 스위치는 준비 중 안내 후 값을 유지한다", async () => {
    const { user } = setup({ panel: "permission", panelAccountIdx: 9000 });
    await user.click(await screen.findByRole("tab", { name: "캠페인 할당" }));
    const list = await screen.findByRole("list", {
      name: "Sub ID 캠페인 할당",
    });
    const toggle = within(list).getAllByRole("switch")[0]!;
    const before = toggle.getAttribute("aria-checked");
    await user.click(toggle);
    expect(toast).toHaveBeenCalledWith("준비 중인 기능입니다.");
    expect(toggle.getAttribute("aria-checked")).toBe(before);
  });

  it("X를 누르면 패널을 닫는다(TAB은 뒤로 버튼도 같음)", async () => {
    const { user, onClosePanel } = setup({
      layout: "tablet",
      panel: "permission",
      panelAccountIdx: 9000,
    });
    await user.click(await screen.findByRole("button", { name: "뒤로가기" }));
    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(onClosePanel).toHaveBeenCalledTimes(2);
  });

  it("TAB의 권한 부여는 목록을 덮는다", async () => {
    setup({ layout: "tablet", panel: "permission", panelAccountIdx: 9000 });
    await screen.findByRole("switch", { name: "구매자 문의 권한" });
    expect(screen.queryByText("sub02")).toBeNull();
  });
});

describe("SubAccountTab 수정", () => {
  it("수정을 열면 PC는 목록 옆 패널에 현재 값을 채워 보인다", async () => {
    setup({ panel: "edit", panelAccountIdx: 9000 });
    expect(await screen.findByText("Sub ID 수정")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /담당자 명/ })).toHaveValue(
      "김담당",
    );
    expect(screen.getByText("sub02")).toBeInTheDocument();
  });

  it("MO는 목록을 덮는 서브 화면으로 보인다", async () => {
    setup({ layout: "mobile", panel: "edit", panelAccountIdx: 9000 });
    expect(await screen.findByText("Sub ID 수정")).toBeInTheDocument();
    expect(screen.queryByText("sub02")).toBeNull();
  });

  it("목록에 없는 Sub ID는 열지 않는다", async () => {
    setup({ panel: "edit", panelAccountIdx: 1234 });
    await screen.findByText("sub01");
    expect(screen.queryByText("Sub ID 수정")).toBeNull();
  });
});

describe("SubAccountTab 빌드(stage·prod)", () => {
  beforeEach(() => vi.stubEnv("DEV", false));
  afterEach(() => vi.unstubAllEnvs());

  it("목록·권한은 실제로 그리고 캠페인 할당 탭만 준비 중을 보인다", async () => {
    const { user } = setup({ panel: "permission", panelAccountIdx: 9000 });
    expect(
      await screen.findByRole("switch", { name: "구매자 문의 권한" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "캠페인 할당" }));
    expect(screen.getByText("준비 중인 기능입니다.")).toBeInTheDocument();
  });
});
