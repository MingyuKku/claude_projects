import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ApiError, serverApi, serverApiV3 } from "@/shared/api";
import { ROUTES } from "@/shared/config";

import { renderRoute } from "./test-utils";

import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApi: { get: vi.fn(), post: vi.fn() },
  serverApiV3: { get: vi.fn(), put: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const session = {
  result: true,
  userIdx: 1,
  accountIdx: 2,
  threadUserIdx: 3,
  authority: "MASTER",
  service: "client",
  nickname: "테스트",
  identifier: "tester",
  email: "test@example.com",
};

const subSession = { ...session, authority: "SUB" };

const masterAccount = {
  result: true,
  user: {
    identifier: "tester",
    email: "test@example.com",
    certification: { certIdx: 1, name: "홍길동", phoneNumber: "01012345678" },
    created: "2024-01-01 10:00",
  },
};

beforeEach(() => {
  vi.mocked(serverApi.get).mockReset().mockResolvedValue(session);
  vi.mocked(serverApi.post)
    .mockReset()
    .mockResolvedValue({ result: true, authority: "MASTER", userIdx: 1 });
  // 계정 설정 탭이 읽는 V3 API.
  vi.mocked(serverApiV3.get)
    .mockReset()
    .mockImplementation((path: string) => {
      if (path === "/mypage/account/master")
        return Promise.resolve(masterAccount);
      if (path === "/mypage/account/bank")
        return Promise.resolve({ result: false, reason: "error" });
      if (path === "/mypage/account/bank/list")
        return Promise.resolve({ bankList: [] });
      return Promise.resolve({ profileUrl: null });
    });
});

function mockViewport({
  tablet,
  desktop,
}: {
  tablet: boolean;
  desktop: boolean;
}) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("1440")
      ? desktop
      : query.includes("768")
        ? tablet
        : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

afterEach(() => {
  // jsdom에는 matchMedia가 없어 기본은 MO 배치.
  Reflect.deleteProperty(window, "matchMedia");
});

function mainNav() {
  return screen.getByRole("navigation", { name: "주 메뉴" });
}

function selectedTabs() {
  return screen
    .getAllByRole("tab")
    .filter((tab) => tab.getAttribute("aria-selected") === "true");
}

describe("마이페이지 · 계정 설정 셸", () => {
  it("MASTER는 계정 설정 헤더·LNB 활성·첫 탭·Master 정보를 본다", async () => {
    await renderRoute(ROUTES.mypageAccount);
    expect(
      await screen.findByRole("heading", { name: "계정 설정" }),
    ).toBeInTheDocument();
    expect(
      within(mainNav()).getByRole("link", { name: "계정 설정" }),
    ).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("tab")).toHaveLength(5);
    expect(selectedTabs().map((tab) => tab.textContent)).toEqual([
      "Master ID 관리",
    ]);
    expect(await screen.findByText("기본 정보")).toBeInTheDocument();
    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(serverApi.get).toHaveBeenCalledWith("/sec", {
      headers: { "X-Path": ROUTES.mypageAccount },
    });
  });

  it("?tab=notification은 알림톡·푸시 알림 카드를 보인다", async () => {
    await renderRoute(`${ROUTES.mypageAccount}?tab=notification`);
    expect(
      await screen.findByRole("heading", { name: "알림톡 알림" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "푸시 알림" }),
    ).toBeInTheDocument();
    expect(serverApiV3.get).not.toHaveBeenCalledWith("/mypage/account/master");
  });

  it("SUB는 본인 정보 탭에서 간편 로그인·회원 탈퇴 없이 정보 수정을 본다", async () => {
    vi.mocked(serverApi.get).mockResolvedValue(subSession);
    await renderRoute(`${ROUTES.mypageAccount}?tab=self`);
    expect(await screen.findByText("정보 수정")).toBeInTheDocument();
    expect(screen.queryByText("간편 로그인 연동")).toBeNull();
    expect(screen.queryByRole("button", { name: "회원 탈퇴" })).toBeNull();
    expect(serverApiV3.get).not.toHaveBeenCalledWith("/mypage/account/master");
  });

  describe("빌드(stage·prod)에서는 목으로 그리는 탭 대신 준비 중을 보인다", () => {
    beforeEach(() => vi.stubEnv("DEV", false));
    afterEach(() => vi.unstubAllEnvs());

    it("?tab=notification", async () => {
      await renderRoute(`${ROUTES.mypageAccount}?tab=notification`);
      expect(
        await screen.findByText("준비 중인 기능입니다."),
      ).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "알림톡 알림" })).toBeNull();
    });

    it("SUB의 ?tab=self", async () => {
      vi.mocked(serverApi.get).mockResolvedValue(subSession);
      await renderRoute(`${ROUTES.mypageAccount}?tab=self`);
      expect(
        await screen.findByText("준비 중인 기능입니다."),
      ).toBeInTheDocument();
      expect(screen.queryByText("정보 수정")).toBeNull();
    });
  });

  it("?tab=company는 등록된 회사정보로 채운 회사정보 폼을 연다", async () => {
    vi.mocked(serverApiV3.get).mockImplementation((path: string) =>
      Promise.resolve(
        path === "/mypage/account/master"
          ? {
              ...masterAccount,
              extraInformation: { companyName: "주식회사 빅버드" },
            }
          : path === "/mypage/account/extra/category"
            ? { category: [] }
            : { profileUrl: null },
      ),
    );
    await renderRoute(`${ROUTES.mypageAccount}?tab=company`);
    expect(await screen.findByRole("textbox", { name: /회사명/ })).toHaveValue(
      "주식회사 빅버드",
    );
  });

  function mockCompleteCompany() {
    vi.mocked(serverApiV3.get).mockImplementation((path: string) =>
      Promise.resolve(
        path === "/mypage/account/master"
          ? {
              ...masterAccount,
              extraInformation: {
                companyName: "주식회사 빅버드",
                contact: "02-1234-5678",
                companyRegistrationNumber: "123-45-67890",
                mailorderBusinessNumber: "2024-서울강남-00000",
                companyRegistrationFileNum: 1,
                mailorderBusinessFileNum: 2,
              },
            }
          : path === "/mypage/account/bank"
            ? { result: false, reason: "error" }
            : path === "/mypage/account/bank/list"
              ? { bankList: [] }
              : { profileUrl: null },
      ),
    );
  }

  it("?tab=bank는 회사정보가 모두 등록돼 있으면 계좌정보 탭을 연다", async () => {
    mockCompleteCompany();
    await renderRoute(`${ROUTES.mypageAccount}?tab=bank`);
    await screen.findByRole("tab", { name: "계좌정보" });
    expect(selectedTabs().map((tab) => tab.textContent)).toEqual(["계좌정보"]);
    await waitFor(() =>
      expect(serverApiV3.get).toHaveBeenCalledWith("/mypage/account/bank"),
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("회사정보가 비어 있으면 계좌정보 탭에서 등록 안내 얼럿을 띄우고 확인하면 회사정보 탭으로 간다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute(`${ROUTES.mypageAccount}?tab=bank`);
    const alert = await screen.findByRole("alertdialog", {
      name: "회사 정보 등록 필요",
    });
    expect(
      within(alert).getByText(
        "계좌 정보를 등록하려면 회사 정보를 먼저 등록해 주세요.",
      ),
    ).toBeInTheDocument();
    expect(serverApiV3.get).not.toHaveBeenCalledWith("/mypage/account/bank");

    await user.click(within(alert).getByRole("button", { name: "확인" }));
    await waitFor(() =>
      expect(new URLSearchParams(router.state.location.search).get("tab")).toBe(
        "company",
      ),
    );
    expect(selectedTabs().map((tab) => tab.textContent)).toEqual(["회사정보"]);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("얼럿에서 취소하면 계좌정보를 열지 않고 Master ID 관리로 돌아간다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute(`${ROUTES.mypageAccount}?tab=bank`);
    const alert = await screen.findByRole("alertdialog");
    await user.click(within(alert).getByRole("button", { name: "취소" }));
    await waitFor(() => expect(router.state.location.search).toBe(""));
    expect(selectedTabs().map((tab) => tab.textContent)).toEqual([
      "Master ID 관리",
    ]);
  });

  it("MASTER의 ?tab=self는 기본 탭으로 대체한다", async () => {
    const router = await renderRoute(`${ROUTES.mypageAccount}?tab=self`);
    await screen.findByRole("tab", { name: "Master ID 관리" });
    expect(selectedTabs().map((tab) => tab.textContent)).toEqual([
      "Master ID 관리",
    ]);
    expect(router.state.location.search).toBe("?tab=self");
  });

  it("SUB는 탭 2개만 보고 허용 밖의 ?tab=company는 기본 탭으로 대체한다", async () => {
    vi.mocked(serverApi.get).mockResolvedValue(subSession);
    await renderRoute(`${ROUTES.mypageAccount}?tab=company`);
    await screen.findByRole("tab", { name: "알림 설정" });
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Sub ID 관리",
      "알림 설정",
    ]);
    expect(selectedTabs().map((tab) => tab.textContent)).toEqual([
      "Sub ID 관리",
    ]);
  });

  it("MO에서 ?tab=sub&panel=create는 탭 줄 아래 생성 화면을 열고 X로 닫으면 목록으로 돌아온다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute(
      `${ROUTES.mypageAccount}?tab=sub&panel=create`,
    );
    expect(
      await screen.findByRole("button", { name: "Sub ID 생성하기" }),
    ).toBeInTheDocument();
    // 탭은 유지되고 목록은 가려진다.
    expect(screen.getAllByRole("tab")).toHaveLength(5);
    expect(screen.queryByText("sub01")).toBeNull();

    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(await screen.findByText("sub01")).toBeInTheDocument();
    expect(router.state.location.search).not.toContain("panel=");
  });

  it("TAB에서 ?tab=sub&panel=create는 탭 줄까지 덮는 전체 화면이다", async () => {
    mockViewport({ tablet: true, desktop: false });
    await renderRoute(`${ROUTES.mypageAccount}?tab=sub&panel=create`);
    expect(
      await screen.findByRole("button", { name: "Sub ID 생성하기" }),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
  });

  it("PC에서는 목록 옆에 패널로 열린다", async () => {
    mockViewport({ tablet: true, desktop: true });
    await renderRoute(`${ROUTES.mypageAccount}?tab=sub&panel=create`);
    expect(
      await screen.findByRole("button", { name: "Sub ID 생성하기" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(5);
    expect(await screen.findByText("sub01")).toBeInTheDocument();
  });

  it("PC·TAB에서 회원 탈퇴를 누르면 약관 다이얼로그가 열리고 취소하면 닫힌다", async () => {
    mockViewport({ tablet: true, desktop: true });
    const user = userEvent.setup();
    const router = await renderRoute(ROUTES.mypageAccount);
    await user.click(await screen.findByRole("button", { name: "회원 탈퇴" }));

    const dialog = await screen.findByRole("dialog", { name: "회원 탈퇴" });
    expect(router.state.location.search).toContain("panel=withdraw");
    expect(
      within(dialog).getByRole("button", { name: "동의 및 탈퇴하기" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/제 6 조/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "취소" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(router.state.location.search).not.toContain("panel=");
  });

  it("MO에서 ?panel=withdraw는 탭 줄까지 덮는 약관 화면이고 X로 닫으면 탭으로 돌아온다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute(`${ROUTES.mypageAccount}?panel=withdraw`);
    expect(
      await screen.findByRole("button", { name: "동의 및 탈퇴하기" }),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(await screen.findAllByRole("tab")).toHaveLength(5);
    expect(router.state.location.search).not.toContain("panel=");
  });

  it("SUB는 ?panel=withdraw를 열지 않는다", async () => {
    vi.mocked(serverApi.get).mockResolvedValue(subSession);
    await renderRoute(`${ROUTES.mypageAccount}?panel=withdraw`);
    await screen.findByRole("tab", { name: "알림 설정" });
    expect(
      screen.queryByRole("button", { name: "동의 및 탈퇴하기" }),
    ).toBeNull();
  });

  it("탭을 누르면 search가 바뀌고 panel·subId는 지워지며 뒤로 가면 이전 탭이다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute(
      `${ROUTES.mypageAccount}?tab=sub&panel=permission&subId=3&lng=ko`,
    );
    await user.click(await screen.findByRole("tab", { name: "회사정보" }));
    const params = new URLSearchParams(router.state.location.search);
    expect(params.get("tab")).toBe("company");
    expect(params.get("lng")).toBe("ko");
    expect(params.has("panel")).toBe(false);
    expect(params.has("subId")).toBe(false);
    expect(selectedTabs().map((tab) => tab.textContent)).toEqual(["회사정보"]);

    await act(async () => {
      await router.navigate(-1);
    });
    await waitFor(() =>
      expect(router.state.location.search).toContain("tab=sub"),
    );
    expect(selectedTabs().map((tab) => tab.textContent)).toEqual([
      "Sub ID 관리",
    ]);
  });

  it("기본 탭으로 돌아가면 tab 쿼리를 지운다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute(`${ROUTES.mypageAccount}?tab=company`);
    await user.click(
      await screen.findByRole("tab", { name: "Master ID 관리" }),
    );
    expect(router.state.location.search).toBe("");
  });

  it("비로그인으로 직접 진입하면 로그인으로 이동한다", async () => {
    vi.mocked(serverApi.get).mockRejectedValue(new ApiError(401, undefined));
    const router = await renderRoute(ROUTES.mypageAccount);
    await screen.findByLabelText("아이디");
    expect(router.state.location.pathname).toBe(ROUTES.login);
  });

  it("비로그인이 LNB 계정 설정을 누르면 로그인으로 이동한다", async () => {
    vi.mocked(serverApi.get).mockRejectedValue(new ApiError(401, undefined));
    const user = userEvent.setup();
    const router = await renderRoute(ROUTES.main);
    await screen.findByRole("button", { name: "로그인" });
    const link = within(mainNav()).getByRole("link", { name: "계정 설정" });
    expect(link).toHaveAttribute("href", ROUTES.login);
    await user.click(link);
    await screen.findByLabelText("아이디");
    expect(router.state.location.pathname).toBe(ROUTES.login);
  });

  it("헤더 프로필 메뉴의 계정 설정은 /mypage/account로 이동한다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute(ROUTES.main);
    await user.click(await screen.findByRole("button", { name: "내 프로필" }));
    await user.click(screen.getByRole("menuitem", { name: "계정 설정" }));
    await screen.findByRole("tab", { name: "Master ID 관리" });
    expect(router.state.location.pathname).toBe(ROUTES.mypageAccount);
  });

  it("접힌 레일의 마이페이지 아이콘은 계정 설정으로 이동한다", async () => {
    await renderRoute(ROUTES.main);
    await screen.findByRole("button", { name: "내 프로필" });
    const rail = screen.getByRole("navigation", { name: "축소 메뉴" });
    expect(
      within(rail).getByRole("link", { name: "마이페이지" }),
    ).toHaveAttribute("href", ROUTES.mypageAccount);
  });

  it("LNB의 구독·빅버드 머니는 비활성이고 이동하지 않는다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute(ROUTES.mypageAccount);
    await screen.findByRole("tab", { name: "Master ID 관리" });
    for (const name of ["구독", "빅버드 머니"]) {
      const link = within(mainNav()).getByRole("link", { name });
      expect(link).toHaveAttribute("aria-disabled", "true");
      await user.click(link);
    }
    expect(router.state.location.pathname).toBe(ROUTES.mypageAccount);
  });

  it("/mypage/subscribe 자리표시자는 셸 안에 보인다", async () => {
    await renderRoute(ROUTES.mypageSubscribe);
    expect(
      await screen.findByRole("heading", { name: "구독" }),
    ).toBeInTheDocument();
    expect(screen.getByText("준비 중인 기능입니다.")).toBeInTheDocument();
    expect(mainNav()).toBeInTheDocument();
  });

  it("SUB는 /mypage/subscribe에 들어갈 수 없고 계정 설정으로 이동한다", async () => {
    vi.mocked(serverApi.get).mockResolvedValue(subSession);
    const router = await renderRoute(ROUTES.mypageSubscribe);
    await screen.findByRole("tab", { name: "Sub ID 관리" });
    expect(router.state.location.pathname).toBe(ROUTES.mypageAccount);
    expect(screen.queryByText("준비 중인 기능입니다.")).toBeNull();
  });

  it("/mypage/money 자리표시자는 셸 안에 보인다", async () => {
    await renderRoute(ROUTES.mypageMoney);
    expect(
      await screen.findByRole("heading", { name: "빅버드 머니" }),
    ).toBeInTheDocument();
    expect(screen.getByText("준비 중인 기능입니다.")).toBeInTheDocument();
  });
});
