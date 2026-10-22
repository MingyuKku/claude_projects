import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Outlet, Route, Routes } from "react-router";
import { SWRConfig } from "swr";

import { ApiError, serverApi } from "@/shared/api";

import { AuthGuard } from "../ui/AuthGuard";
import {
  formLogin,
  getLastAllowedSession,
  logout,
  useSession,
} from "./session-api";

import type { ReactNode } from "react";
import type { Cache } from "swr";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    serverApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() },
  };
});

const sessionBody = {
  result: true,
  userIdx: 1,
  accountIdx: 2,
  threadUserIdx: 3,
  authority: "MASTER",
  service: "client",
  nickname: null,
  identifier: "hong1234",
  email: "a@b.com",
  phone: "01012345678",
};

function wrapper(cache: Cache) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <SWRConfig value={{ provider: () => cache }}>{children}</SWRConfig>;
  };
}

function SessionName({ pathname }: { pathname: string }) {
  const { session, isLoading, isError } = useSession(pathname);
  if (isLoading) return <p>loading</p>;
  if (isError) return <p>error</p>;
  return <p>{session?.displayName}</p>;
}

function renderGuard(cache = new Map()) {
  const Wrapper = wrapper(cache);
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={
              <AuthGuard>
                {(session) => <p>hello {session.displayName}</p>}
              </AuthGuard>
            }
          />
          <Route path="/login" element={<p>login page</p>} />
        </Routes>
      </MemoryRouter>
    </Wrapper>,
  );
}

describe("useSession", () => {
  beforeEach(() => {
    vi.mocked(serverApi.get).mockReset();
  });

  it("asks /sec with the X-Path header and returns the view model", async () => {
    vi.mocked(serverApi.get).mockResolvedValue(sessionBody);
    const Wrapper = wrapper(new Map());
    render(<SessionName pathname="/" />, { wrapper: Wrapper });

    expect(await screen.findByText("hong1234")).toBeInTheDocument();
    expect(serverApi.get).toHaveBeenCalledWith("/sec", {
      headers: { "X-Path": "/" },
    });
  });

  it("reports an error when the server rejects the request", async () => {
    vi.mocked(serverApi.get).mockImplementation(async () => {
      throw new ApiError(401, undefined);
    });
    render(<SessionName pathname="/" />, { wrapper: wrapper(new Map()) });

    expect(await screen.findByText("error")).toBeInTheDocument();
  });

  it("revalidates on every mount even with a warm cache", async () => {
    vi.mocked(serverApi.get).mockResolvedValue(sessionBody);
    const cache = new Map();

    const first = render(<SessionName pathname="/" />, {
      wrapper: wrapper(cache),
    });
    await screen.findByText("hong1234");
    first.unmount();

    render(<SessionName pathname="/" />, { wrapper: wrapper(cache) });
    await waitFor(() => expect(serverApi.get).toHaveBeenCalledTimes(2));
  });
});

describe("AuthGuard", () => {
  beforeEach(() => {
    vi.mocked(serverApi.get).mockReset();
  });

  it("hands the session to children once the server allows the path", async () => {
    vi.mocked(serverApi.get).mockResolvedValue(sessionBody);
    renderGuard();

    expect(await screen.findByText("hello hong1234")).toBeInTheDocument();
  });

  it("redirects to the local login page when unauthenticated", async () => {
    vi.mocked(serverApi.get).mockImplementation(async () => {
      throw new ApiError(401, undefined);
    });
    renderGuard();

    expect(await screen.findByText("login page")).toBeInTheDocument();
  });

  it("ignores the external redirectTo and keeps the login flow in this app", async () => {
    vi.mocked(serverApi.get).mockRejectedValue(
      new ApiError(401, {
        result: false,
        redirectTo: "https://stage.member.bigbird.co.kr/client",
      }),
    );
    renderGuard();
    expect(await screen.findByText("login page")).toBeInTheDocument();
  });

  // 셸은 유지하되, 다른 페이지의 본문은 그 경로의 권한 확인이 끝난 뒤에만 그림.
  function renderTwoPages(pageKey?: string) {
    let answerNextPath: (value: unknown) => void = () => {};
    vi.mocked(serverApi.get)
      .mockResolvedValueOnce(sessionBody)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          answerNextPath = resolve;
        }),
      );
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <MemoryRouter initialEntries={["/a"]}>
          <Routes>
            <Route
              element={
                <AuthGuard pageKey={pageKey}>
                  {(session, isCheckingPage) => (
                    <>
                      <p>shell {session.displayName}</p>
                      <Link to="/b">go b</Link>
                      {isCheckingPage ? <p>checking page</p> : <Outlet />}
                    </>
                  )}
                </AuthGuard>
              }
            >
              <Route path="/a" element={<p>page a</p>} />
              <Route path="/b" element={<p>page b</p>} />
            </Route>
            <Route path="/login" element={<p>login page</p>} />
          </Routes>
        </MemoryRouter>
      </SWRConfig>,
    );
    return (value: unknown) => act(async () => answerNextPath(value));
  }

  it("keeps the shell but holds another page until its path is allowed", async () => {
    const answer = renderTwoPages();
    await userEvent.click(await screen.findByRole("link", { name: "go b" }));

    expect(screen.getByText("shell hong1234")).toBeInTheDocument();
    expect(screen.getByText("checking page")).toBeInTheDocument();
    expect(screen.queryByText("page b")).not.toBeInTheDocument();

    await answer(sessionBody);
    expect(await screen.findByText("page b")).toBeInTheDocument();
  });

  it("never renders a denied page before redirecting", async () => {
    const answer = renderTwoPages();
    await userEvent.click(await screen.findByRole("link", { name: "go b" }));
    expect(screen.queryByText("page b")).not.toBeInTheDocument();

    await answer({ ...sessionBody, result: false });
    expect(await screen.findByText("login page")).toBeInTheDocument();
    expect(screen.queryByText("page b")).not.toBeInTheDocument();
  });

  it("keeps rendering within the same page while re-checking", async () => {
    renderTwoPages("same-page");
    await userEvent.click(await screen.findByRole("link", { name: "go b" }));

    expect(screen.getByText("page b")).toBeInTheDocument();
    expect(screen.queryByText("checking page")).not.toBeInTheDocument();
  });

  it("redirects when the server denies the path", async () => {
    vi.mocked(serverApi.get).mockResolvedValue({
      ...sessionBody,
      result: false,
    });
    renderGuard();

    expect(await screen.findByText("login page")).toBeInTheDocument();
  });
});

describe("formLogin", () => {
  it("posts multipart credentials to /login", async () => {
    vi.mocked(serverApi.post).mockResolvedValue({
      result: true,
      authority: "MASTER",
    });

    const result = await formLogin("hong1234", "pw");

    const [path, body] = vi.mocked(serverApi.post).mock.calls[0] ?? [];
    expect(path).toBe("/login");
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("username")).toBe("hong1234");
    expect((body as FormData).get("password")).toBe("pw");
    expect(result).toEqual({ result: true, authority: "MASTER" });
  });
});

describe("logout", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("302 수동 응답이면 쿠키 만료 요청이 끝난다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ type: "opaqueredirect" }),
    );
    await expect(logout()).resolves.toBeUndefined();
  });

  it.each([200, 401, 500])(
    "리다이렉트가 아닌 %s 응답을 성공으로 간주하지 않는다",
    async (status) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response(null, { status })),
      );
      await expect(logout()).rejects.toMatchObject({ status });
    },
  );
});

describe("getLastAllowedSession", () => {
  it("로그아웃하면 직전 사용자의 세션을 지운다", async () => {
    vi.mocked(serverApi.get).mockResolvedValue(sessionBody);
    render(<SessionName pathname="/" />, { wrapper: wrapper(new Map()) });
    await screen.findByText("hong1234");
    expect(getLastAllowedSession()?.identifier).toBe("hong1234");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ type: "opaqueredirect", status: 0 }),
    );
    await logout();
    vi.unstubAllGlobals();
    expect(getLastAllowedSession()).toBeUndefined();
  });

  it("세션 확인이 실패하면 지운다", async () => {
    vi.mocked(serverApi.get).mockResolvedValueOnce(sessionBody);
    render(<SessionName pathname="/" />, { wrapper: wrapper(new Map()) });
    await screen.findByText("hong1234");

    vi.mocked(serverApi.get).mockRejectedValueOnce(
      new ApiError(401, undefined),
    );
    render(<SessionName pathname="/other" />, { wrapper: wrapper(new Map()) });
    await screen.findByText("error");
    expect(getLastAllowedSession()).toBeUndefined();
  });
});
