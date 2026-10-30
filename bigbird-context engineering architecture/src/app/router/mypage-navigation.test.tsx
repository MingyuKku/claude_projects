import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ApiError, serverApi, serverApiV3 } from "@/shared/api";
import { ROUTES } from "@/shared/config";

import {
  mockSession,
  mockSessionError,
  mockV3Get,
  renderRoute,
  resetSession,
} from "./test-utils";

import type * as SharedApi from "@/shared/api";

// 이 파일은 펼친 PC LNB에서 셸 동작을 검증함. LNB 기본은 접힘이고(sidebar-store), 저장된 상태는 스토어를 불러올 때
// localStorage에서 복원되므로 모듈을 불러오기 전에 "펼쳐 둔 사용자" 상태를 저장해 둠.
vi.hoisted(() => {
  localStorage.setItem(
    "bigbird:sidebar",
    JSON.stringify({ state: { isCollapsed: false }, version: 0 }),
  );
});

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
  resetSession(session);
  vi.mocked(serverApi.post)
    .mockReset()
    .mockResolvedValue({ result: true, authority: "MASTER", userIdx: 1 });
  // 계정 설정 탭이 읽는 V3 API.
  mockV3Get((path: string) => {
    if (path === "/mypage/account/master")
      return Promise.resolve(masterAccount);
    if (path === "/mypage/account/bank")
      return Promise.resolve({ result: false, reason: "error" });
    if (path === "/mypage/account/bank/list")
      return Promise.resolve({ bankList: [] });
    if (path === "/mypage/account/agreement")
      return Promise.resolve({
        alimAdInfoAgree: true,
        alimNightAgree: false,
        pushAdInfoAgree: true,
        pushNightAgree: false,
      });
    if (path === "/mypage/account/sub")
      return Promise.resolve({
        sub: [{ idx: 9000, identifier: "sub01", name: "김담당" }],
        pagingInfo: { page: 1, size: 8, totalCount: 1, totalPage: 1 },
      });
    if (path === "/mypage/account/sub/self")
      return Promise.resolve({
        accountIdx: 9000,
        identifier: "sub01",
        name: "김담당",
        email: "sub01@bigbird.com",
        phone: "01012345678",
        profileImageUrl: null,
      });
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
    expect(serverApiV3.get).toHaveBeenCalledWith("/sec", {
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
    expect(serverApiV3.get).toHaveBeenCalledWith("/mypage/account/agreement");
    expect(serverApiV3.get).not.toHaveBeenCalledWith("/mypage/account/master");
  });

  it("SUB는 본인 정보 탭에서 간편 로그인·회원 탈퇴·휴대폰 번호 없이 기본 정보 보기를 본다", async () => {
    mockSession(subSession);
    await renderRoute(`${ROUTES.mypageAccount}?tab=self`);
    expect(await screen.findByText("기본 정보")).toBeInTheDocument();
    expect(screen.getByText("김담당")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "수정" })).toBeInTheDocument();
    expect(screen.queryByText("휴대폰 번호")).toBeNull();
    expect(screen.queryByText("간편 로그인 연동")).toBeNull();
    expect(screen.queryByRole("button", { name: "회원 탈퇴" })).toBeNull();
    expect(serverApiV3.get).toHaveBeenCalledWith("/mypage/account/sub/self");
    expect(serverApiV3.get).not.toHaveBeenCalledWith("/mypage/account/master");
  });

  describe("빌드(stage·prod)에서도 실제 API 탭은 그대로 보인다", () => {
    beforeEach(() => vi.stubEnv("DEV", false));
    afterEach(() => vi.unstubAllEnvs());

    it("?tab=notification은 실제 API라 빌드에서도 알림 카드를 보인다", async () => {
      await renderRoute(`${ROUTES.mypageAccount}?tab=notification`);
      expect(
        await screen.findByRole("heading", { name: "알림톡 알림" }),
      ).toBeInTheDocument();
      expect(screen.queryByText("준비 중인 기능입니다.")).toBeNull();
    });

    it("SUB의 ?tab=self는 본인 정보를 읽어 보인다", async () => {
      mockSession(subSession);
      await renderRoute(`${ROUTES.mypageAccount}?tab=self`);
      expect(await screen.findByText("기본 정보")).toBeInTheDocument();
      expect(screen.queryByText("준비 중인 기능입니다.")).toBeNull();
    });
  });

  it("?tab=company는 등록된 회사정보를 읽기 전용 보기로 연다", async () => {
    mockV3Get((path: string) =>
      Promise.resolve(
        path === "/mypage/account/master"
          ? {
              ...masterAccount,
              companyInformation: { companyName: "주식회사 빅버드" },
            }
          : path === "/mypage/account/company/category"
            ? { category: [] }
            : { profileUrl: null },
      ),
    );
    await renderRoute(`${ROUTES.mypageAccount}?tab=company`);
    expect(await screen.findByText("주식회사 빅버드")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /회사명/ })).toBeNull();
    expect(screen.getByRole("button", { name: "수정" })).toBeInTheDocument();
  });

  it("?tab=company에 등록된 회사정보가 없으면 곧바로 입력 모드로 연다", async () => {
    await renderRoute(`${ROUTES.mypageAccount}?tab=company`);
    expect(await screen.findByRole("textbox", { name: /회사명/ })).toHaveValue(
      "",
    );
  });

  function mockCompleteCompany() {
    mockV3Get((path: string) =>
      Promise.resolve(
        path === "/mypage/account/master"
          ? {
              ...masterAccount,
              companyInformation: {
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
    mockSession(subSession);
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
    mockSession(subSession);
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
    mockSessionError(new ApiError(401, undefined));
    const router = await renderRoute(ROUTES.mypageAccount);
    await screen.findByLabelText("아이디");
    expect(router.state.location.pathname).toBe(ROUTES.login);
  });

  it("비로그인이 LNB 계정 설정을 누르면 로그인으로 이동한다", async () => {
    mockSessionError(new ApiError(401, undefined));
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

  it("Master의 LNB 빅버드 머니는 활성이고 빅버드 머니 화면으로 이동한다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute(ROUTES.mypageAccount);
    await screen.findByRole("tab", { name: "Master ID 관리" });
    const link = within(mainNav()).getByRole("link", { name: "빅버드 머니" });
    expect(link).not.toHaveAttribute("aria-disabled");
    expect(link).toHaveAttribute("href", ROUTES.mypageMoney);
    await user.click(link);
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ROUTES.mypageMoney),
    );
  });

  it("비로그인이 LNB 빅버드 머니를 누르면 로그인으로 이동한다", async () => {
    mockSessionError(new ApiError(401, undefined));
    const user = userEvent.setup();
    const router = await renderRoute(ROUTES.main);
    await screen.findByRole("button", { name: "로그인" });
    const link = within(mainNav()).getByRole("link", { name: "빅버드 머니" });
    expect(link).toHaveAttribute("href", ROUTES.login);
    await user.click(link);
    await screen.findByLabelText("아이디");
    expect(router.state.location.pathname).toBe(ROUTES.login);
  });

  describe("SUB의 LNB 권한(GET /v3/sec의 메뉴 권한)", () => {
    function mockPermissions(access: {
      isBigbirdMoneyAccess: boolean;
      isPurchaserQuestionAccess: boolean;
      isInfluencerMatchingAccess?: boolean;
    }) {
      mockSession({ ...subSession, ...access });
    }

    it("권한이 없으면 빅버드 머니·구매자 문의·인플루언서 검색이 비활성이다", async () => {
      mockPermissions({
        isBigbirdMoneyAccess: false,
        isPurchaserQuestionAccess: false,
      });
      await renderRoute(ROUTES.mypageAccount);
      await screen.findByRole("tab", { name: "Sub ID 관리" });
      for (const name of ["빅버드 머니", "구매자 문의", "인플루언서 검색"]) {
        expect(within(mainNav()).getByRole("link", { name })).toHaveAttribute(
          "aria-disabled",
          "true",
        );
      }
    });

    it("권한이 있으면 해당 메뉴가 활성이다", async () => {
      mockPermissions({
        isBigbirdMoneyAccess: true,
        isPurchaserQuestionAccess: true,
        isInfluencerMatchingAccess: true,
      });
      await renderRoute(ROUTES.mypageAccount);
      await screen.findByRole("tab", { name: "Sub ID 관리" });
      for (const name of ["빅버드 머니", "구매자 문의", "인플루언서 검색"]) {
        expect(
          within(mainNav()).getByRole("link", { name }),
        ).not.toHaveAttribute("aria-disabled");
      }
    });
  });

  it("Master의 LNB 구독은 활성이고 구독 화면으로 이동한다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute(ROUTES.mypageAccount);
    await screen.findByRole("tab", { name: "Master ID 관리" });
    const link = within(mainNav()).getByRole("link", { name: "구독" });
    expect(link).not.toHaveAttribute("aria-disabled");
    await user.click(link);
    await screen.findByRole("tab", { name: "이용요약" });
    expect(router.state.location.pathname).toBe(ROUTES.mypageSubscribe);
  });

  it("SUB의 LNB 구독은 비활성이다", async () => {
    mockSession(subSession);
    await renderRoute(ROUTES.mypageAccount);
    await screen.findByRole("tab", { name: "Sub ID 관리" });
    expect(
      within(mainNav()).getByRole("link", { name: "구독" }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("/mypage/subscribe는 셸 안에서 구독·이용요약·결제내역 탭을 보인다", async () => {
    await renderRoute(ROUTES.mypageSubscribe);
    expect(
      await screen.findByRole("heading", { name: "구독" }),
    ).toBeInTheDocument();
    // 헤더 제목(셸)은 페이지 본문보다 먼저 그려지므로 본문의 탭은 기다려서 찾는다.
    expect(await screen.findByRole("tab", { name: "구독" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "이용요약" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "결제내역" })).toBeInTheDocument();
    expect(mainNav()).toBeInTheDocument();
  });

  it("SUB는 /mypage/subscribe에 들어갈 수 없고 계정 설정으로 이동한다", async () => {
    mockSession(subSession);
    const router = await renderRoute(ROUTES.mypageSubscribe);
    await screen.findByRole("tab", { name: "Sub ID 관리" });
    expect(router.state.location.pathname).toBe(ROUTES.mypageAccount);
    expect(screen.queryByText("준비 중인 기능입니다.")).toBeNull();
  });
});

describe("마이페이지 · 빅버드 머니", () => {
  const chargeItem = {
    requestDate: "2026-10-23 14:23:18",
    requestAmount: 50000,
    bankName: "신한은행",
    accountNumber: "1234567890123456",
    depositDate: "N/A",
    depositState: "대기중",
    receiptUrl: null,
    payMethod: "VBank",
  };
  const usageItem = {
    usageType: "사용",
    usageDetails: "인플루언서 계약비용(PICK형)",
    usageDate: "2026-10-23 14:23:18",
    campaignName: "여름 시즌 캠핑 용품 신제품 리뷰",
    campaignCode: "CP0001",
    campaignService: "PICK형",
    usageAmount: -50000,
    remainingAmount: 1250000,
  };

  beforeEach(() => {
    sessionStorage.clear();
    mockV3Get((path: string) =>
      path === "/mypage/biz-money"
        ? Promise.resolve({ bizMoney: 10000 })
        : Promise.resolve({ profileUrl: null }),
    );
    vi.mocked(serverApiV3.post).mockImplementation((path: string) => {
      if (path === "/mypage/biz-money/charge")
        return Promise.resolve({
          list: [chargeItem],
          count: 1,
          currentPage: 1,
          entrySize: 10,
        });
      if (path === "/mypage/biz-money/usage")
        return Promise.resolve({
          list: [usageItem],
          count: 1,
          currentPage: 1,
          entrySize: 10,
        });
      return Promise.resolve({ result: true });
    });
  });

  it("충전 내역 탭이 기본이고 보유 금액·안내·충전 상세 내역을 보인다(TAB)", async () => {
    mockViewport({ tablet: true, desktop: false });
    await renderRoute(ROUTES.mypageMoney);

    expect(
      await screen.findByRole("heading", { name: "빅버드 머니" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "충전 내역" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(await screen.findByText("대기 중")).toBeInTheDocument();
    expect(screen.getByText("보유 빅버드 머니")).toBeInTheDocument();
    expect(screen.getByText("안내")).toBeInTheDocument();
    // 헤더 P 금액도 같은 잔액.
    expect(
      screen.getByRole("button", { name: "빅버드 머니 10,000" }),
    ).toBeInTheDocument();
  });

  it("충전하기를 누르면 TAB은 본문을 충전 카드로 바꾸고 뒤로 버튼으로 돌아온다", async () => {
    mockViewport({ tablet: true, desktop: false });
    const user = userEvent.setup();
    const router = await renderRoute(ROUTES.mypageMoney);

    await user.click(await screen.findByRole("button", { name: /충전하기/ }));

    expect(router.state.location.search).toContain("panel=charge");
    expect(
      await screen.findByRole("textbox", { name: "충전 금액 입력" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("충전 상세 내역")).toBeNull();

    await user.click(screen.getByRole("button", { name: "뒤로가기" }));
    expect(await screen.findByText("충전 상세 내역")).toBeInTheDocument();
    expect(router.state.location.search).not.toContain("panel");
  });

  it("PC는 거래 상세를 오른쪽 패널로 열고 목록을 그대로 둔다", async () => {
    mockViewport({ tablet: true, desktop: true });
    const user = userEvent.setup();
    const router = await renderRoute(ROUTES.mypageMoney);

    await user.click(await screen.findByRole("button", { name: "상세 보기" }));

    expect(router.state.location.search).toContain("panel=charge-detail");
    expect(await screen.findByText("거래 상세 보기")).toBeInTheDocument();
    expect(screen.getByText("1234567890123456")).toBeInTheDocument();
    expect(screen.getByText("충전 상세 내역")).toBeInTheDocument();
  });

  it("사용 내역 탭은 새 열 순서로 보이고 상세 보기에서 사용 후 잔액을 본다(PC)", async () => {
    mockViewport({ tablet: true, desktop: true });
    const user = userEvent.setup();
    await renderRoute(`${ROUTES.mypageMoney}?tab=usage`);

    expect(
      await screen.findByRole("columnheader", { name: "캠페인 명" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual([
      "캠페인 명",
      "사용 일자",
      "사용 내역",
      "사용 금액",
      "캠페인 코드",
      "상세 보기",
    ]);
    expect(screen.getByText("-50,000원")).toBeInTheDocument();
    expect(screen.queryByText("1,250,000원")).toBeNull();

    await user.click(screen.getByRole("button", { name: "상세 보기" }));
    expect(await screen.findByText("1,250,000원")).toBeInTheDocument();
  });

  it("다른 탭의 하위 화면 쿼리는 무시한다", async () => {
    mockViewport({ tablet: true, desktop: true });
    await renderRoute(`${ROUTES.mypageMoney}?tab=usage&panel=charge`);
    await screen.findByText("사용 상세 내역");
    expect(screen.queryByText("빅버드 머니 충전")).toBeNull();
  });

  it("MO는 세그먼트로 충전과 상세 내역을 나눈다", async () => {
    const user = userEvent.setup();
    await renderRoute(ROUTES.mypageMoney);

    expect(await screen.findByText("보유 빅버드 머니")).toBeInTheDocument();
    expect(screen.queryByText("충전 상세 내역")).toBeNull();

    await user.click(screen.getByRole("tab", { name: "상세 내역" }));
    expect(await screen.findByText("충전 상세 내역")).toBeInTheDocument();
  });

  it("결제 서버가 isPaid=true를 붙여 돌려보내면 접수 알럿을 띄우고 쿼리를 지운다", async () => {
    mockViewport({ tablet: true, desktop: false });
    const router = await renderRoute(
      `${ROUTES.mypageMoney}?isPaid=true&gopaymethod=VCard&goodName=%3F%3F`,
    );

    expect(await screen.findByText("충전 요청 완료")).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.search).toBe(""));
  });

  it("isPaid=true가 없으면 알럿을 띄우지 않는다", async () => {
    mockViewport({ tablet: true, desktop: false });
    await renderRoute(ROUTES.mypageMoney);

    await screen.findByText("충전 상세 내역");
    expect(screen.queryByText("충전 요청 완료")).toBeNull();
  });
});
