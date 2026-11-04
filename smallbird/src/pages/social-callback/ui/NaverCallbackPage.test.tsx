import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { toast } from "sonner";

import { serverApiV3 } from "@/shared/api";
import { ROUTES } from "@/shared/config";

import { NaverCallbackPage } from "./NaverCallbackPage";

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

// 로그인 경로는 이 테스트의 대상이 아니라 로그인 완료만 막아 둠.
const completeNaverLogin = vi.fn();
vi.mock(
  "@/features/social-login/api/complete-login",
  async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return { ...actual, completeNaverLogin: () => completeNaverLogin() };
  },
);

const INTENT_KEY = "bigbird.naver-link-intent";

function renderCallback() {
  const router = createMemoryRouter(
    [
      { path: ROUTES.authNaver, element: <NaverCallbackPage /> },
      { path: ROUTES.mypageAccount, element: <p>account page</p> },
      { path: ROUTES.login, element: <p>login page</p> },
      { path: ROUTES.main, element: <p>main page</p> },
    ],
    { initialEntries: [ROUTES.authNaver] },
  );
  render(<RouterProvider router={router} />);
}

beforeEach(() => {
  sessionStorage.clear();
  completeNaverLogin.mockReset();
  vi.mocked(toast).mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(serverApiV3.post).mockReset();
});

describe("NaverCallbackPage", () => {
  it("연결하려고 시작해 돌아왔으면(state 일치) 로그인 대신 연결하고 계정 설정으로 돌려보낸다", async () => {
    sessionStorage.setItem(
      INTENT_KEY,
      JSON.stringify({ state: "abc123", createdAt: Date.now() }),
    );
    window.history.replaceState(
      null,
      "",
      `${ROUTES.authNaver}?code=naver-code&state=abc123`,
    );
    vi.mocked(serverApiV3.post).mockResolvedValueOnce({
      items: [{ platform: "naver", linked: true, email: "n@example.com" }],
    });

    renderCallback();

    expect(await screen.findByText("account page")).toBeInTheDocument();
    expect(serverApiV3.post).toHaveBeenCalledWith("/mypage/account/sns/naver", {
      code: "naver-code",
      state: "abc123",
    });
    expect(toast).toHaveBeenCalledWith("네이버 간편 로그인을 연동했습니다.");
    expect(completeNaverLogin).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(INTENT_KEY)).toBeNull();
  });

  it("연결이 거절돼도 사유를 알리고 계정 설정으로 돌려보낸다", async () => {
    sessionStorage.setItem(
      INTENT_KEY,
      JSON.stringify({ state: "abc123", createdAt: Date.now() }),
    );
    window.history.replaceState(
      null,
      "",
      `${ROUTES.authNaver}?code=naver-code&state=abc123`,
    );
    const { ApiError } = await import("@/shared/api");
    vi.mocked(serverApiV3.post).mockRejectedValueOnce(
      new ApiError(409, { result: false, reason: "SNS_ALREADY_LINKED" }),
    );

    renderCallback();

    expect(await screen.findByText("account page")).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(
      "다른 네이버 계정이 이미 연동돼 있습니다. 해제한 뒤 다시 연동해 주세요.",
    );
  });

  it("연결 의도가 남아 있어도 state가 없는 일반 로그인 복귀는 로그인으로 처리한다", async () => {
    sessionStorage.setItem(
      INTENT_KEY,
      JSON.stringify({ state: "abc123", createdAt: Date.now() }),
    );
    window.history.replaceState(
      null,
      "",
      `${ROUTES.authNaver}?code=naver-code`,
    );
    completeNaverLogin.mockResolvedValue({ status: "success" });

    renderCallback();

    await waitFor(() => expect(completeNaverLogin).toHaveBeenCalledOnce());
    expect(await screen.findByText("main page")).toBeInTheDocument();
    expect(serverApiV3.post).not.toHaveBeenCalled();
  });
});
