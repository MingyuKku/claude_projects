import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { SWRConfig } from "swr";

import { clearLoginCredential, stashLoginCredential } from "@/entities/session";
import { ApiError, serverApi } from "@/shared/api";

import { ExpiredPage } from "./ExpiredPage";

import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof SharedApi>();
  return {
    ...actual,
    serverApi: {
      ...actual.serverApi,
      put: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
    },
  };
});

const OLD_PASSWORD = "Oldpass1!";
const NEW_PASSWORD = "Newpass1!";

function renderPage({ hasCredential }: { hasCredential: boolean }) {
  clearLoginCredential();
  if (hasCredential) {
    stashLoginCredential({ id: "user1", password: OLD_PASSWORD });
  }
  const router = createMemoryRouter(
    [
      { path: "/expired", element: <ExpiredPage /> },
      { path: "/login", element: <p>로그인 화면</p> },
    ],
    { initialEntries: ["/expired"] },
  );
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <RouterProvider router={router} />
    </SWRConfig>,
  );
  return { router, user: userEvent.setup() };
}

describe("ExpiredPage", () => {
  beforeEach(() => {
    vi.mocked(serverApi.put).mockReset();
    vi.mocked(serverApi.get).mockReset();
    vi.mocked(serverApi.post).mockReset();
  });

  it("처음에는 변경하기가 꺼져 있고 세 입력이 모두 보인다", () => {
    renderPage({ hasCredential: true });
    expect(screen.getByRole("button", { name: "변경하기" })).toBeDisabled();
    expect(screen.getByLabelText("현재 비밀번호")).toBeInTheDocument();
    expect(
      screen.getByLabelText("새 비밀번호", { exact: true }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("새 비밀번호 확인")).toBeInTheDocument();
  });

  it("새 비밀번호와 확인이 다르면 불일치 문구를 보여 준다", async () => {
    const { user } = renderPage({ hasCredential: true });
    await user.type(
      screen.getByLabelText("새 비밀번호", { exact: true }),
      NEW_PASSWORD,
    );
    await user.type(screen.getByLabelText("새 비밀번호 확인"), "different1!");
    expect(
      screen.getByText("비밀번호가 불일치합니다. 다시 입력해주세요."),
    ).toBeInTheDocument();
  });

  it("자격 증명이 없으면 다음에 변경하기가 로그인으로 보낸다", async () => {
    const { router, user } = renderPage({ hasCredential: false });
    await user.click(screen.getByRole("button", { name: "다음에 변경하기" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(serverApi.get).not.toHaveBeenCalled();
  });

  it("헤더 뒤로가기는 로그인으로 이동한다", async () => {
    const { router, user } = renderPage({ hasCredential: true });
    await user.click(screen.getAllByRole("button", { name: "뒤로가기" })[0]!);
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
  });

  it("연기 요청이 실패하면 안내 문구를 보여 준다", async () => {
    vi.mocked(serverApi.get).mockRejectedValue(new ApiError(500, {}));
    const { user } = renderPage({ hasCredential: true });
    await user.click(screen.getByRole("button", { name: "다음에 변경하기" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "잠시 후 다시 시도해주세요.",
    );
  });

  it("연기 뒤 재로그인에 실패하면 로그인으로 보낸다", async () => {
    vi.mocked(serverApi.get).mockResolvedValue(undefined);
    vi.mocked(serverApi.post).mockRejectedValue(new ApiError(401, {}));
    const { router, user } = renderPage({ hasCredential: true });
    await user.click(screen.getByRole("button", { name: "다음에 변경하기" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
  });

  it("변경이 끝나면 완료 화면의 로그인하기로 로그인에 간다", async () => {
    vi.mocked(serverApi.put).mockResolvedValue({ result: true });
    const { router, user } = renderPage({ hasCredential: true });
    await user.type(screen.getByLabelText("현재 비밀번호"), OLD_PASSWORD);
    await user.type(
      screen.getByLabelText("새 비밀번호", { exact: true }),
      NEW_PASSWORD,
    );
    await user.type(screen.getByLabelText("새 비밀번호 확인"), NEW_PASSWORD);
    await user.click(screen.getByRole("button", { name: "변경하기" }));

    expect(await screen.findByText("비밀번호 변경 완료")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "로그인하기" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
  });
});
