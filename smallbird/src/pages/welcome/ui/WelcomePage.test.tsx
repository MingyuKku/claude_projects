import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";

import { WelcomePage } from "./WelcomePage";

function renderPage() {
  const router = createMemoryRouter(
    [
      { path: "/welcome", element: <WelcomePage /> },
      { path: "/", element: <p>홈</p> },
    ],
    { initialEntries: ["/welcome"] },
  );
  const view = render(<RouterProvider router={router} />);
  return { ...view, router };
}

describe("WelcomePage", () => {
  it("승인 대기 안내를 줄바꿈과 함께 보여 준다", () => {
    const { container } = renderPage();

    expect(
      screen.getByRole("heading", { name: /파트너가 되어 반가워요/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/광고주 회원가입을 검토 중입니다/)).toBeVisible();
    expect(container.querySelectorAll("p br")).toHaveLength(2);
    expect(container).not.toHaveTextContent("<br");
    expect(
      screen.getByRole("button", { name: "BIGBIRD 둘러보기" }),
    ).toBeInTheDocument();
  });

  it("둘러보기를 누르면 앱 안의 공개 홈으로 이동한다", async () => {
    const { router } = renderPage();

    await userEvent.click(
      screen.getByRole("button", { name: "BIGBIRD 둘러보기" }),
    );

    expect(router.state.location.pathname).toBe("/");
  });
});
