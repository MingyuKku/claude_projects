import { render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";
import { toast } from "sonner";

import { serverApiV3 } from "@/shared/api";
import { ROUTES } from "@/shared/config";

import { KakaoCallbackPage } from "./KakaoCallbackPage";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    serverApiV3: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  };
});

const LINK_KEY = "bigbird.kakao-link-intent";
const LOGIN_KEY = "bigbird.kakao-login-intent";

function saveIntent(key: string) {
  sessionStorage.setItem(
    key,
    JSON.stringify({ state: "abc123", createdAt: Date.now() }),
  );
}

function SnsLinkProbe() {
  const { state } = useLocation();
  return <p>sns link {JSON.stringify(state)}</p>;
}

function openCallback(query: string, { isStrict = false } = {}) {
  window.history.replaceState(null, "", `${ROUTES.authKakao}${query}`);
  const router = createMemoryRouter(
    [
      { path: ROUTES.authKakao, element: <KakaoCallbackPage /> },
      { path: ROUTES.mypageAccount, element: <p>account page</p> },
      { path: ROUTES.login, element: <p>login page</p> },
      { path: ROUTES.main, element: <p>main page</p> },
      { path: ROUTES.snsLink, element: <SnsLinkProbe /> },
    ],
    { initialEntries: [ROUTES.authKakao] },
  );
  const app = <RouterProvider router={router} />;
  render(isStrict ? <StrictMode>{app}</StrictMode> : app);
}

beforeEach(() => {
  sessionStorage.clear();
  vi.mocked(toast).mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(serverApiV3.post).mockReset();
});

describe("KakaoCallbackPage 연결", () => {
  it("연결하려고 시작해 돌아왔으면(state 일치) 로그인 대신 연결하고 계정 설정으로 돌려보낸다", async () => {
    saveIntent(LINK_KEY);
    vi.mocked(serverApiV3.post).mockResolvedValueOnce({
      items: [{ platform: "kakao", linked: true, email: "k@example.com" }],
    });

    openCallback("?code=auth-code&state=abc123");

    expect(await screen.findByText("account page")).toBeInTheDocument();
    expect(serverApiV3.post).toHaveBeenCalledWith("/mypage/account/sns/kakao", {
      code: "auth-code",
      redirectUri: expect.stringMatching(/\/auth\/kakao$/) as string,
    });
    expect(toast).toHaveBeenCalledWith("카카오 간편 로그인을 연동했습니다.");
    expect(sessionStorage.getItem(LINK_KEY)).toBeNull();
  });

  it("개발 모드(StrictMode)의 이중 마운트에서도 연결을 한 번만 요청한다", async () => {
    saveIntent(LINK_KEY);
    vi.mocked(serverApiV3.post).mockResolvedValue({
      items: [{ platform: "kakao", linked: true, email: "k@example.com" }],
    });

    openCallback("?code=auth-code&state=abc123", { isStrict: true });

    expect(await screen.findByText("account page")).toBeInTheDocument();
    expect(serverApiV3.post).toHaveBeenCalledOnce();
    expect(toast).toHaveBeenCalledOnce();
  });

  it("연결이 거절돼도 사유를 알리고 계정 설정으로 돌려보낸다", async () => {
    saveIntent(LINK_KEY);
    const { ApiError } = await import("@/shared/api");
    vi.mocked(serverApiV3.post).mockRejectedValueOnce(
      new ApiError(409, { result: false, reason: "SNS_ALREADY_LINKED" }),
    );

    openCallback("?code=auth-code&state=abc123");

    expect(await screen.findByText("account page")).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(
      "다른 카카오 계정이 이미 연동돼 있습니다. 해제한 뒤 다시 연동해 주세요.",
    );
  });
});

describe("KakaoCallbackPage 로그인", () => {
  it("로그인하려고 시작해 돌아왔으면(state 일치) V3 로그인에 인가 코드를 보내고 메인으로 보낸다", async () => {
    saveIntent(LOGIN_KEY);
    vi.mocked(serverApiV3.post).mockResolvedValueOnce({
      userIdx: 3,
      authority: "ROLE_ADVERTISER",
    });

    openCallback("?code=auth-code&state=abc123");

    expect(await screen.findByText("main page")).toBeInTheDocument();
    expect(serverApiV3.post).toHaveBeenCalledWith("/auth/sns/kakao/login", {
      code: "auth-code",
      redirectUri: expect.stringMatching(/\/auth\/kakao$/) as string,
    });
    expect(sessionStorage.getItem(LOGIN_KEY)).toBeNull();
    expect(window.location.search).toBe("");
  });

  it("미가입(404 NEED_SIGNUP)이면 신원 토큰을 들고 SNS 연동 화면으로 보낸다", async () => {
    saveIntent(LOGIN_KEY);
    const { ApiError } = await import("@/shared/api");
    vi.mocked(serverApiV3.post).mockRejectedValueOnce(
      new ApiError(404, {
        result: false,
        reason: "NEED_SIGNUP",
        platform: "kakao",
        email: "k@b.co",
        snsLinkToken: "signed-token",
      }),
    );

    openCallback("?code=auth-code&state=abc123");

    expect(await screen.findByText(/sns link/)).toHaveTextContent(
      '"snsLinkToken":"signed-token"',
    );
  });

  it("신원 토큰이 없는 NEED_SIGNUP이나 그 밖의 거절은 로그인 화면으로 돌려보낸다", async () => {
    saveIntent(LOGIN_KEY);
    const { ApiError } = await import("@/shared/api");
    vi.mocked(serverApiV3.post).mockRejectedValueOnce(
      new ApiError(404, { result: false, reason: "NEED_SIGNUP" }),
    );

    openCallback("?code=auth-code&state=abc123");

    expect(await screen.findByText("login page")).toBeInTheDocument();
  });

  it("개발 모드(StrictMode)의 이중 마운트에서도 일회용 인가 코드를 서버에 한 번만 보낸다", async () => {
    saveIntent(LOGIN_KEY);
    vi.mocked(serverApiV3.post).mockResolvedValue({
      userIdx: 3,
      authority: "ROLE_ADVERTISER",
    });

    openCallback("?code=auth-code&state=abc123", { isStrict: true });

    expect(await screen.findByText("main page")).toBeInTheDocument();
    expect(serverApiV3.post).toHaveBeenCalledOnce();
  });

  it("우리가 시작하지 않은 복귀(의도 없음)는 서버를 부르지 않고 로그인 화면으로 보낸다", async () => {
    openCallback("?code=auth-code&state=abc123");

    expect(await screen.findByText("login page")).toBeInTheDocument();
    expect(serverApiV3.post).not.toHaveBeenCalled();
  });

  it("state가 다르면(요청 위조) 서버를 부르지 않고 로그인 화면으로 보낸다", async () => {
    saveIntent(LOGIN_KEY);

    openCallback("?code=auth-code&state=other");

    expect(await screen.findByText("login page")).toBeInTheDocument();
    expect(serverApiV3.post).not.toHaveBeenCalled();
  });

  it("연결 의도가 남아 있어도 로그인 state가 없으면 연결로 처리하지 않는다", async () => {
    saveIntent(LINK_KEY);

    openCallback("?code=auth-code");

    expect(await screen.findByText("login page")).toBeInTheDocument();
    expect(serverApiV3.post).not.toHaveBeenCalled();
  });
});
