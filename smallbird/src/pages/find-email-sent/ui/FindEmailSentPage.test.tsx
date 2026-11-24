import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router";

import { FindEmailSentPage } from "./FindEmailSentPage";

function renderWithRoutes() {
  const router = createMemoryRouter(
    [
      { path: "/find/email-sent", element: <FindEmailSentPage /> },
      { path: "/login", element: <p>로그인 화면</p> },
    ],
    { initialEntries: ["/find/email-sent"] },
  );
  render(<RouterProvider router={router} />);
  return { router, user: userEvent.setup() };
}

describe("FindEmailSentPage", () => {
  it("발송 안내를 줄바꿈과 함께 보여 준다", () => {
    const { container } = render(
      <MemoryRouter>
        <FindEmailSentPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/등록된 이메일로 비밀번호 재설정 링크를 발송하였습니다/),
    ).toBeVisible();
    expect(container.querySelectorAll("p br")).toHaveLength(1);
    expect(container).not.toHaveTextContent("<br");
    expect(
      screen.getByRole("button", { name: "처음으로" }),
    ).toBeInTheDocument();
  });

  it("처음으로 버튼은 로그인으로 이동한다", async () => {
    const { router, user } = renderWithRoutes();
    await user.click(screen.getByRole("button", { name: "처음으로" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
  });

  it("헤더 뒤로가기도 로그인으로 이동한다", async () => {
    const { router, user } = renderWithRoutes();
    await user.click(screen.getAllByRole("button", { name: "뒤로가기" })[0]!);
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
  });
});
