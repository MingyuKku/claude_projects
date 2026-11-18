import { render, screen, waitFor } from "@testing-library/react";
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
