import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { SWRConfig } from "swr";

import { ApiError, serverApi } from "@/shared/api";

import { AuthGuard } from "../ui/AuthGuard";
import { formLogin, useSession } from "./session-api";

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
      <MemoryRouter initialEntries={["/main"]}>
        <Routes>
          <Route
            path="/main"
            element={
              <AuthGuard>
                {(session) => <p>hello {session.displayName}</p>}
              </AuthGuard>
            }
          />
          <Route path="/introduction" element={<p>introduction page</p>} />
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
    render(<SessionName pathname="/main" />, { wrapper: Wrapper });

    expect(await screen.findByText("hong1234")).toBeInTheDocument();
    expect(serverApi.get).toHaveBeenCalledWith("/sec", {
      headers: { "X-Path": "/main" },
    });
  });

  it("reports an error when the server rejects the request", async () => {
    vi.mocked(serverApi.get).mockImplementation(async () => {
      throw new ApiError(401, undefined);
    });
    render(<SessionName pathname="/main" />, { wrapper: wrapper(new Map()) });

    expect(await screen.findByText("error")).toBeInTheDocument();
  });

  it("revalidates on every mount even with a warm cache", async () => {
    vi.mocked(serverApi.get).mockResolvedValue(sessionBody);
    const cache = new Map();

    const first = render(<SessionName pathname="/main" />, {
      wrapper: wrapper(cache),
    });
    await screen.findByText("hong1234");
    first.unmount();

    render(<SessionName pathname="/main" />, { wrapper: wrapper(cache) });
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

  it("redirects to the introduction page when unauthenticated", async () => {
    vi.mocked(serverApi.get).mockImplementation(async () => {
      throw new ApiError(401, undefined);
    });
    renderGuard();

    expect(await screen.findByText("introduction page")).toBeInTheDocument();
  });

  it("redirects when the server denies the path", async () => {
    vi.mocked(serverApi.get).mockResolvedValue({
      ...sessionBody,
      result: false,
    });
    renderGuard();

    expect(await screen.findByText("introduction page")).toBeInTheDocument();
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
