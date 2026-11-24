import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";

import { ROUTES } from "@/shared/config";

import { LoginPage } from "./LoginPage";

function renderLogin(state?: unknown) {
  const router = createMemoryRouter(
    [{ path: ROUTES.login, element: <LoginPage /> }],
    { initialEntries: [{ pathname: ROUTES.login, state }] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe("LoginPage 소셜 로그인 실패 안내", () => {
  it("복귀 화면이 실패 state를 넘기면 로그인 실패 안내를 보이고 방문 기록의 state는 지운다", async () => {
    const router = renderLogin({ snsLoginFailed: true });
    expect(
      await screen.findByText("로그인하지 못했습니다. 다시 시도해 주세요."),
    ).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.state).toBeNull());
    expect(
      screen.getByText("로그인하지 못했습니다. 다시 시도해 주세요."),
    ).toBeInTheDocument();
  });

  it("state가 없으면 안내를 보이지 않는다", () => {
    renderLogin();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("LoginPage 기본 동작", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState(null, "", "/");
  });

  it("아이디·비밀번호 찾기와 회원가입 링크가 서비스 구분 쿼리를 달고 이동한다", () => {
    renderLogin();
    expect(screen.getByRole("link", { name: "아이디 찾기" })).toHaveAttribute(
      "href",
      "/find?service=client&type=id",
    );
    expect(screen.getByRole("link", { name: "비밀번호 찾기" })).toHaveAttribute(
      "href",
      "/find?service=client&type=pw",
    );
    expect(screen.getByRole("link", { name: "회원가입" })).toHaveAttribute(
      "href",
      "/join?service=client",
    );
  });

  it("되돌아가기는 방문 기록의 이전 화면으로 간다", async () => {
    const router = createMemoryRouter(
      [
        { path: "/before", element: <p>이전 화면</p> },
        { path: ROUTES.login, element: <LoginPage /> },
      ],
      { initialEntries: ["/before", ROUTES.login], initialIndex: 1 },
    );
    render(<RouterProvider router={router} />);
    await userEvent.click(screen.getByRole("button", { name: "되돌아가기" }));
    expect(await screen.findByText("이전 화면")).toBeInTheDocument();
  });

  it("문의 버튼을 누르면 문의 패널이 폼을 대신하고 뒤로가기로 돌아온다", async () => {
    renderLogin();
    await userEvent.click(screen.getByRole("button", { name: "문의" }));
    expect(screen.getByText("카카오톡 상담하기")).toBeInTheDocument();
    expect(screen.queryByLabelText("아이디")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "뒤로가기" }));
    expect(screen.getByLabelText("아이디")).toBeInTheDocument();
  });

  it("펫플레이 도메인은 펫플레이 문구를 쓰고 문의 버튼을 숨긴다", () => {
    window.history.replaceState(null, "", "/login?brand=petplay");
    renderLogin();
    expect(
      screen.getByRole("tab", { name: "펫플레이 파트너센터" }),
    ).toBeInTheDocument();
    expect(screen.getByAltText("펫플레이 로고")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "문의" }),
    ).not.toBeInTheDocument();
  });

  it("승인 검토중 계정이면 안내 알럿을 띄우고 확인으로 닫는다", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ reason: "accountRejected" }), {
        status: 401,
      }),
    );
    renderLogin();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("아이디"), "tester");
    await user.type(screen.getByLabelText("비밀번호"), "pw1234!");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(
      await screen.findByText("빅버드 광고주 회원 검토중"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "확인" }));
    expect(
      screen.queryByText("빅버드 광고주 회원 검토중"),
    ).not.toBeInTheDocument();
  });

  it("승인 검토중 알럿은 취소로도 닫힌다", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ reason: "accountRejected" }), {
        status: 401,
      }),
    );
    renderLogin();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("아이디"), "tester");
    await user.type(screen.getByLabelText("비밀번호"), "pw1234!");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    await screen.findByText("빅버드 광고주 회원 검토중");
    await user.click(screen.getByRole("button", { name: "취소" }));
    await waitFor(() =>
      expect(
        screen.queryByText("빅버드 광고주 회원 검토중"),
      ).not.toBeInTheDocument(),
    );
  });
});

describe("LoginPage 역할 탭", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("파트너센터 탭이 기본 선택이다", () => {
    renderLogin();
    expect(
      screen.getByRole("tab", { name: "빅버드 파트너센터" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "크리에이터" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("크리에이터 탭에서 로그인하면 검증·서버 호출 없이 준비 중 알럿만 띄운다", async () => {
    renderLogin();
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "크리에이터" }));
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(
      await screen.findByRole("alertdialog", { name: "알림" }),
    ).toHaveTextContent("준비 중인 기능입니다.");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "확인" }));
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
  });

  it("크리에이터 탭에서 찾기·회원가입 링크는 이동하지 않고 알럿을 띄운다", async () => {
    const router = renderLogin();
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "크리에이터" }));
    await user.click(screen.getByRole("link", { name: "아이디 찾기" }));

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(ROUTES.login);
  });

  it("크리에이터 탭에서 SNS 버튼은 로그인을 시작하지 않고 알럿을 띄운다", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    renderLogin();
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "크리에이터" }));
    await user.click(screen.getByRole("button", { name: "카카오로 시작하기" }));

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });

  it("탭을 바꾸면 입력값과 오류 문구를 비운다", async () => {
    renderLogin();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "로그인" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "크리에이터" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("크리에이터 탭에서도 되돌아가기는 동작한다", async () => {
    const router = createMemoryRouter(
      [
        { path: "/before", element: <p>이전 화면</p> },
        { path: ROUTES.login, element: <LoginPage /> },
      ],
      { initialEntries: ["/before", ROUTES.login], initialIndex: 1 },
    );
    render(<RouterProvider router={router} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "크리에이터" }));
    await user.click(screen.getByRole("button", { name: "되돌아가기" }));

    expect(await screen.findByText("이전 화면")).toBeInTheDocument();
  });
});

describe("LoginPage 약관", () => {
  it("개인정보처리방침 버튼은 이동 없이 약관 다이얼로그를 열고 확인으로 닫는다", async () => {
    const router = renderLogin();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "개인정보처리방침" }));

    expect(
      await screen.findByRole("dialog", { name: "개인정보처리방침" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(ROUTES.login);

    await user.click(screen.getByRole("button", { name: "확인" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("이용약관 버튼은 서비스 이용약관을 열고 취소로 닫는다", async () => {
    renderLogin();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "이용약관" }));

    expect(
      await screen.findByRole("dialog", { name: "이용약관" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "취소" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("모바일 더보기 메뉴에서 약관을 열고 닫기 버튼으로 닫는다", async () => {
    renderLogin();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "더보기" }));
    await user.click(
      await screen.findByRole("menuitem", { name: "개인정보처리방침" }),
    );

    expect(
      await screen.findByRole("dialog", { name: "개인정보처리방침" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "닫기" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("Esc로도 약관 다이얼로그가 닫힌다", async () => {
    renderLogin();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "이용약관" }));
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});
