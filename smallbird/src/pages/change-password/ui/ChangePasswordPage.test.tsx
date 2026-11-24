import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { SWRConfig } from "swr";

import { memberApi } from "@/shared/api";

import { ChangePasswordPage } from "./ChangePasswordPage";

import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof SharedApi>();
  return { ...actual, memberApi: { ...actual.memberApi, patch: vi.fn() } };
});

const VALID_PASSWORD = "Zebra7391!";

function renderPage() {
  const router = createMemoryRouter(
    [
      { path: "/find", element: <p>찾기 화면</p> },
      { path: "/changePw", element: <ChangePasswordPage /> },
      { path: "/login", element: <p>로그인 화면</p> },
    ],
    { initialEntries: ["/find", "/changePw"], initialIndex: 1 },
  );
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <RouterProvider router={router} />
    </SWRConfig>,
  );
  return { router, user: userEvent.setup() };
}

describe("ChangePasswordPage", () => {
  beforeEach(() => {
    vi.mocked(memberApi.patch).mockReset();
  });

  it("헤더 뒤로가기는 이전 화면으로 돌아간다", async () => {
    const { router, user } = renderPage();
    await user.click(screen.getAllByRole("button", { name: "뒤로가기" })[0]!);
    await waitFor(() => expect(router.state.location.pathname).toBe("/find"));
  });

  it("규칙 안내가 보이고 형식이 틀리면 오류 문구로 바뀐다", async () => {
    const { user } = renderPage();
    expect(
      screen.getAllByText("영문, 숫자, 특수문자를 조합 8-20자로 입력해주세요."),
    ).toHaveLength(2);

    await user.type(screen.getByLabelText("비밀번호", { exact: true }), "abc");
    expect(screen.getByLabelText("비밀번호", { exact: true })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("변경이 끝나면 완료 팝업의 로그인하러 가기로 로그인에 간다", async () => {
    vi.mocked(memberApi.patch).mockResolvedValue({ result: "success" });
    const { router, user } = renderPage();
    await user.type(
      screen.getByLabelText("비밀번호", { exact: true }),
      VALID_PASSWORD,
    );
    await user.type(screen.getByLabelText("비밀번호 확인"), VALID_PASSWORD);
    await user.click(screen.getByRole("button", { name: "변경하기" }));

    expect(await screen.findByText("비밀번호 변경 완료")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /로그인하러 가기/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
  });
});
