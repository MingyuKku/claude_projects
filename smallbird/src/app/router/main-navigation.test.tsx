import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { ApiError, serverApi, serverApiV3 } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { hardNavigate } from "@/shared/lib";

import {
  mockSession,
  mockSessionError,
  mockSessionErrorOnce,
  mockSessionPending,
  renderRoute,
  resetSession,
} from "./test-utils";

// 이 파일은 펼친 PC LNB에서 셸 동작을 검증함. LNB 기본은 접힘이고(sidebar-store), 저장된 상태는 스토어를 불러올 때
// localStorage에서 복원되므로 모듈을 불러오기 전에 "펼쳐 둔 사용자" 상태를 저장해 둠.
vi.hoisted(() => {
  localStorage.setItem(
    "bigbird:sidebar",
    JSON.stringify({ state: { isCollapsed: false }, version: 0 }),
  );
});

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  serverApi: { get: vi.fn(), post: vi.fn() },
  serverApiV3: { get: vi.fn(), post: vi.fn() },
}));

vi.mock("@/shared/lib", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  hardNavigate: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), dismiss: vi.fn() } }));

afterEach(() => vi.unstubAllGlobals());

const session = {
  result: true,
  userIdx: 1,
  accountIdx: 2,
  threadUserIdx: 3,
  authority: "ADMIN",
  service: "client",
  identifier: "tester",
  email: "test@example.com",
};

beforeEach(() => {
  vi.mocked(hardNavigate).mockClear();
  resetSession(session);
  vi.mocked(serverApi.post)
    .mockReset()
    .mockResolvedValue({ result: true, authority: "ADMIN", userIdx: 1 });
});

describe("루트 메인과 공통 메뉴", () => {
  it("로그인 성공 후 / 에서 헤더와 LNB를 표시한다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute(ROUTES.login);
    await user.type(await screen.findByLabelText("아이디"), "tester");
    await user.type(screen.getByLabelText("비밀번호"), "test-password");
    await user.click(screen.getByRole("button", { name: "로그인" }));
    expect(
      await screen.findByRole("heading", { name: "홈" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
    expect(serverApiV3.get).toHaveBeenCalledWith("/sec", {
      headers: { "X-Path": "/" },
      signal: expect.any(AbortSignal),
    });
    const nav = screen.getByRole("navigation", { name: "주 메뉴" });
    expect(within(nav).getByRole("link", { name: "홈" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("기존 /main 링크는 쿼리를 유지하며 / 로 이동한다", async () => {
    const router = await renderRoute(`${ROUTES.legacyMain}?login=1`);
    expect(
      await screen.findByRole("heading", { name: "홈" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
    expect(router.state.location.search).toBe("?login=1");
  });

  it("미인증 홈은 외부 redirectTo를 무시하고 비로그인 헤더를 보여준다", async () => {
    mockSessionError(
      new ApiError(401, {
        result: false,
        redirectTo: "https://stage.member.bigbird.co.kr/client",
      }),
    );
    const user = userEvent.setup();
    const router = await renderRoute(ROUTES.main);
    const login = await screen.findByRole("button", { name: "로그인" });
    expect(router.state.location.pathname).toBe(ROUTES.main);
    expect(screen.getByRole("heading", { name: "홈" })).toBeInTheDocument();
    const header = screen.getByRole("banner");
    expect(
      within(header).getByRole("button", { name: "이용 가이드" }),
    ).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "내 프로필" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^알림/ }),
    ).not.toBeInTheDocument();
    await user.click(login);
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ROUTES.login),
    );
  });

  it("로그인하면 알림 벨로 알림 없음 팝오버를 열고 닫을 수 있다", async () => {
    const user = userEvent.setup();
    await renderRoute(ROUTES.main);
    await user.click(await screen.findByRole("button", { name: "알림" }));
    const panel = await screen.findByRole("region", { name: "알림" });
    expect(within(panel).getByText("새로운 알림 없음")).toBeInTheDocument();
    await user.click(within(panel).getByRole("button", { name: "알림 닫기" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("region", { name: "알림" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("세션 조회 장애에도 홈 본문과 비로그인 헤더를 보여 주고 토스트로 재시도할 수 있다", async () => {
    mockSessionErrorOnce(new ApiError(500, undefined));
    const router = await renderRoute(ROUTES.main);
    expect(
      await screen.findByRole("heading", { level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그인" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(ROUTES.main);
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "로그인 상태를 확인하지 못했습니다. 다시 시도해 주세요.",
        expect.objectContaining({
          action: expect.objectContaining({ label: "다시 시도" }),
        }),
      ),
    );
    const action = vi.mocked(toast.error).mock.calls.at(-1)?.[1]?.action;
    if (!action || typeof action !== "object" || !("onClick" in action)) {
      throw new Error("토스트에 재시도 액션이 없습니다");
    }
    await act(async () => {
      action.onClick({} as never);
    });
    expect(
      await screen.findByRole("button", { name: "내 프로필" }),
    ).toBeInTheDocument();
  });

  it("다시 시도가 또 실패하면 실패 토스트를 다시 띄우고, 성공하면 토스트를 닫는다", async () => {
    const sessionFailedText =
      "로그인 상태를 확인하지 못했습니다. 다시 시도해 주세요.";

    function failedToastCalls() {
      return vi
        .mocked(toast.error)
        .mock.calls.filter(([text]) => text === sessionFailedText);
    }

    async function clickRetry() {
      const action = failedToastCalls().at(-1)?.[1]?.action;
      if (!action || typeof action !== "object" || !("onClick" in action)) {
        throw new Error("토스트에 재시도 액션이 없습니다");
      }
      await act(async () => {
        action.onClick({} as never);
      });
    }

    vi.mocked(toast.error).mockClear();
    mockSessionErrorOnce(new ApiError(500, undefined));
    mockSessionErrorOnce(new ApiError(500, undefined));
    await renderRoute(ROUTES.main);
    await waitFor(() => expect(failedToastCalls()).toHaveLength(1));

    await clickRetry();
    await waitFor(() => expect(failedToastCalls()).toHaveLength(2));

    vi.mocked(toast.dismiss).mockClear();
    await clickRetry();
    expect(
      await screen.findByRole("button", { name: "내 프로필" }),
    ).toBeInTheDocument();
    expect(failedToastCalls()).toHaveLength(2);
    expect(toast.dismiss).toHaveBeenCalledWith("session-check-failed");
  });

  it("세션 확인 중에는 비로그인 UI 위에 전체 오버레이와 스피너를 덮는다", async () => {
    const resolveSession = mockSessionPending();
    await renderRoute(ROUTES.main);
    expect(
      await screen.findByRole("status", { name: "로그인 상태 확인 중" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그인" })).toBeInTheDocument();
    resolveSession(session);
    expect(
      await screen.findByRole("button", { name: "내 프로필" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("LNB 하위 메뉴 그룹은 접힌 상태가 기본이고, 현재 화면의 그룹만 펼친다", async () => {
    await renderRoute(ROUTES.main);
    const [support] = await screen.findAllByText("고객센터", {
      selector: "summary span",
    });
    expect(support?.closest("details")).not.toHaveAttribute("open");
  });

  it("인플루언서 관리·채팅은 비로그인이 누르면 로그인 안내 알럿을 띄우고, 로그인하면 준비 중으로 비활성이다", async () => {
    mockSessionError(new ApiError(401, { result: false }));
    const user = userEvent.setup();
    const router = await renderRoute(ROUTES.main);
    const nav = await screen.findByRole("navigation", { name: "주 메뉴" });
    await user.click(
      within(nav).getByRole("link", { name: "인플루언서 관리" }),
    );
    const alert = await screen.findByRole("alertdialog");
    expect(within(alert).getByText("로그인 필요")).toBeInTheDocument();
    await user.click(within(alert).getByRole("button", { name: "취소" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await user.click(within(nav).getByRole("link", { name: "채팅" }));
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "로그인하러 가기",
      }),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
  });

  it("로그인한 사용자에게 인플루언서 관리·채팅은 준비 중으로 비활성이다", async () => {
    await renderRoute(ROUTES.main);
    const nav = await screen.findByRole("navigation", { name: "주 메뉴" });
    for (const name of ["인플루언서 관리", "채팅"]) {
      expect(within(nav).getByRole("link", { name })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    }
  });

  it("PC LNB를 접었다 다시 펼칠 수 있다", async () => {
    const user = userEvent.setup();
    await renderRoute(ROUTES.main);
    await user.click(await screen.findByRole("button", { name: "메뉴 접기" }));
    expect(screen.getByRole("button", { name: "메뉴 펼치기" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await user.click(screen.getByRole("button", { name: "메뉴 펼치기" }));
    expect(screen.getByRole("button", { name: "메뉴 접기" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("ADMIN의 로고는 아이디 변경으로 이동한다", async () => {
    await renderRoute(ROUTES.main);
    expect(
      await screen.findByRole("link", { name: "빅버드 · 아이디 변경" }),
    ).toHaveAttribute("href", ROUTES.switchAccount);
  });

  it("ADMIN이 아닌 로그인 사용자의 로고는 홈으로 이동한다", async () => {
    mockSession({
      ...session,
      authority: "MASTER",
    });
    await renderRoute(ROUTES.main);
    expect(
      await screen.findByRole("link", { name: "빅버드 · 홈" }),
    ).toHaveAttribute("href", ROUTES.main);
  });

  it("비로그인의 로고는 홈으로 이동한다", async () => {
    mockSessionError(new ApiError(401, { result: false }));
    await renderRoute(ROUTES.main);
    expect(
      await screen.findByRole("link", { name: "빅버드 · 홈" }),
    ).toHaveAttribute("href", ROUTES.main);
  });

  it("비로그인의 이용 가이드는 헤더에만 있고 LNB에는 없다", async () => {
    mockSessionError(new ApiError(401, { result: false }));
    await renderRoute(ROUTES.main);
    const header = await screen.findByRole("banner");
    expect(
      within(header).getByRole("button", { name: "이용 가이드" }),
    ).toBeInTheDocument();
    for (const sidebar of screen.getAllByRole("complementary")) {
      expect(
        within(sidebar).queryByRole("button", { name: "이용 가이드" }),
      ).not.toBeInTheDocument();
    }
  });

  it("로그인하면 이용 가이드가 헤더에서 LNB 하단으로 옮겨진다", async () => {
    await renderRoute(ROUTES.main);
    await screen.findByRole("button", { name: "내 프로필" });
    expect(
      within(screen.getByRole("banner")).queryByRole("button", {
        name: "이용 가이드",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "이용 가이드" }),
    ).toBeInTheDocument();
  });

  it("전체 메뉴는 Escape로 닫히고 열었던 버튼으로 포커스가 돌아온다", async () => {
    const user = userEvent.setup();
    await renderRoute(ROUTES.main);
    const trigger = await screen.findByRole("button", { name: "메뉴 열기" });
    await user.click(trigger);
    expect(
      screen.getByRole("dialog", { name: "전체 메뉴" }),
    ).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });

  it("전체 메뉴의 홈을 선택하면 메뉴를 닫고 준비 중 메뉴는 이동하지 않는다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute(ROUTES.main);
    await user.click(await screen.findByRole("button", { name: "메뉴 열기" }));
    const dialog = screen.getByRole("dialog");
    const campaign = within(dialog).getByRole("link", { name: "캠페인" });
    expect(campaign).toHaveAttribute("aria-disabled", "true");
    await user.click(campaign);
    expect(router.state.location.pathname).toBe("/");
    await user.click(within(dialog).getByRole("link", { name: "홈" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("전체 메뉴의 로고를 누르면 메뉴가 닫힌다", async () => {
    mockSession({
      ...session,
      authority: "MASTER",
    });
    const user = userEvent.setup();
    await renderRoute(ROUTES.main);
    await user.click(await screen.findByRole("button", { name: "메뉴 열기" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("link", { name: "빅버드 · 홈" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("프로필은 실제 세션 정보를 보여주고 계정 설정으로 이동한다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute(ROUTES.main);
    await user.click(await screen.findByRole("button", { name: "내 프로필" }));
    expect(screen.getByText(session.email)).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "로그아웃" }),
    ).not.toHaveAttribute("data-disabled");
    const settings = screen.getByRole("menuitem", { name: "계정 설정" });
    expect(settings).not.toHaveAttribute("data-disabled");
    await user.click(settings);
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ROUTES.mypageAccount),
    );
  });
  it("로그아웃은 외부 리다이렉트를 따르지 않고 현재 앱의 홈을 재로드한다", async () => {
    const user = userEvent.setup();
    vi.mocked(serverApiV3.post).mockResolvedValue({ result: true });
    await renderRoute(ROUTES.main);
    await user.click(await screen.findByRole("button", { name: "내 프로필" }));
    await user.click(screen.getByRole("menuitem", { name: "로그아웃" }));
    await waitFor(() => expect(hardNavigate).toHaveBeenCalledWith("/"));
    expect(serverApiV3.post).toHaveBeenCalledWith("/auth/logout");
  });

  it("로그아웃 실패는 현재 프로필을 유지하고 오류를 안내한다", async () => {
    const user = userEvent.setup();
    vi.mocked(serverApiV3.post).mockRejectedValue(new TypeError("연결 실패"));
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    await renderRoute(ROUTES.main);
    await user.click(await screen.findByRole("button", { name: "내 프로필" }));
    await user.click(screen.getByRole("menuitem", { name: "로그아웃" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "로그아웃하지 못했습니다. 다시 시도해 주세요.",
      ),
    );
    expect(hardNavigate).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "내 프로필" }),
    ).toBeInTheDocument();
    errorLog.mockRestore();
  });
});

// 메뉴를 누른 뒤 세션 확인이 끝날 때까지 이전 화면에 머물므로, 누른 메뉴에 이동 중임을 표시함.
describe("메뉴 이동 중 표시", () => {
  it("LNB 메뉴를 누르면 이동이 끝날 때까지 그 메뉴를 이동 중으로 표시한다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute(ROUTES.main);
    await screen.findByRole("heading", { name: "홈" });
    const nav = screen.getByRole("navigation", { name: "주 메뉴" });

    const resolveSession = mockSessionPending();
    await user.click(within(nav).getByRole("link", { name: "빅버드 문의" }));
    expect(
      within(nav).getByRole("link", { name: "빅버드 문의" }),
    ).toHaveAttribute("aria-busy", "true");
    expect(router.state.location.pathname).toBe(ROUTES.main);

    await act(async () => resolveSession(session));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ROUTES.customerCenterBigbird),
    );
  });

  it("전체 메뉴는 이동하는 동안 열려 있고 이동이 끝나면 닫힌다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute(ROUTES.main);
    await user.click(await screen.findByRole("button", { name: "메뉴 열기" }));
    const dialog = screen.getByRole("dialog");

    const resolveSession = mockSessionPending();
    await user.click(within(dialog).getByRole("link", { name: "빅버드 문의" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: "빅버드 문의" }),
    ).toHaveAttribute("aria-busy", "true");

    await act(async () => resolveSession(session));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ROUTES.customerCenterBigbird),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});

// 로그인했지만 그 경로 권한이 없을 때(403). 세션 middleware가 처리함(app/router/session-middleware.ts).
describe("권한 없는 화면", () => {
  function sessionPaths() {
    return vi
      .mocked(serverApiV3.get)
      .mock.calls.filter(([path]) => path === "/sec")
      .map(
        ([, options]) =>
          (options as { headers: Record<string, string> }).headers["X-Path"],
      );
  }

  it("주소로 바로 들어오면 홈으로 보내고 권한 없음을 알린다", async () => {
    mockSessionErrorOnce(new ApiError(403, { result: false }));
    const router = await renderRoute(ROUTES.customerCenterBuyer);
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ROUTES.main),
    );
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "해당 메뉴에 접근할 권한이 없습니다. Master ID에 권한을 요청해 주세요.",
        expect.anything(),
      ),
    );
  });

  it("앱 안에서 옮기려 하면 지금 화면에 머물고 세션을 새로 받아 권한 표시를 갱신한다", async () => {
    const router = await renderRoute(`${ROUTES.main}?from=test`);
    await screen.findByRole("heading", { name: "홈" });
    vi.mocked(toast.error).mockClear();

    mockSessionErrorOnce(new ApiError(403, { result: false }));
    await act(async () => {
      await router.navigate(ROUTES.customerCenterBuyer);
    });
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "해당 메뉴에 접근할 권한이 없습니다. Master ID에 권한을 요청해 주세요.",
        expect.anything(),
      ),
    );
    expect(router.state.location.pathname).toBe(ROUTES.main);
    expect(router.state.location.search).toBe("?from=test");
    expect(sessionPaths()).toEqual([
      ROUTES.main,
      ROUTES.customerCenterBuyer,
      ROUTES.main,
    ]);
  });

  it("Sub ID가 구독에 들어가면 안내 없이 계정 설정으로 보낸다", async () => {
    mockSessionErrorOnce(new ApiError(403, { result: false }));
    const router = await renderRoute(ROUTES.mypageSubscribe);
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ROUTES.mypageAccount),
    );
    expect(toast.error).not.toHaveBeenCalledWith(
      "해당 메뉴에 접근할 권한이 없습니다. Master ID에 권한을 요청해 주세요.",
      expect.anything(),
    );
  });
});

describe("홈 본문과 검색 경로", () => {
  it("/ 에서 홈 본문이 로그인 여부와 관계없이 보인다", async () => {
    mockSessionError(new ApiError(401, { result: false }));
    await renderRoute(ROUTES.main);
    expect(await screen.findByRole("heading", { level: 2 })).toHaveTextContent(
      "AI가 딱 맞는 인플루언서를 찾아드려요",
    );
  });

  it("검색을 제출하면 셸 안의 준비 중 화면으로 이동한다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute(ROUTES.main);
    await user.type(await screen.findByRole("textbox"), "스킨케어");
    await user.click(screen.getByRole("button", { name: "인플루언서 탐색" }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ROUTES.influencerSearch),
    );
    expect(router.state.location.search).toContain("platform=instagram");
    expect(
      await screen.findByText("준비 중인 화면입니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "주 메뉴" }),
    ).toBeInTheDocument();
    // 시안이 없어 헤더 제목과 LNB 활성 항목을 "인플루언서 매칭"으로 임시 처리한다.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "인플루언서 매칭",
    );
    // 인플루언서 매칭 그룹이 펼쳐지고 "인플루언서 검색"이 현재 위치로 표시된다.
    expect(
      within(screen.getByRole("navigation", { name: "주 메뉴" })).getByRole(
        "link",
        { name: "인플루언서 검색" },
      ),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(screen.getByRole("navigation", { name: "주 메뉴" })).getByRole(
        "link",
        { name: "홈" },
      ),
    ).not.toHaveAttribute("aria-current");
  });

  it("비로그인도 검색 경로로 이동한다", async () => {
    mockSessionError(new ApiError(401, { result: false }));
    const user = userEvent.setup();
    const router = await renderRoute(ROUTES.main);
    await user.type(await screen.findByRole("textbox"), "스킨케어");
    await user.click(screen.getByRole("button", { name: "인플루언서 탐색" }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ROUTES.influencerSearch),
    );
    expect(
      await screen.findByText("준비 중인 화면입니다."),
    ).toBeInTheDocument();
  });
});
