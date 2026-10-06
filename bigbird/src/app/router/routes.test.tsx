import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { RouteErrorBoundary } from "../providers/ErrorBoundary";
import { routes } from "./routes";

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

describe("app router", () => {
  it("/ 는 홈 페이지를 보여준다", async () => {
    renderAt("/");
    expect(
      await screen.findByRole("heading", { name: "bigbird" }),
    ).toBeInTheDocument();
  });

  it("알 수 없는 경로는 404 페이지를 보여준다", async () => {
    renderAt("/does-not-exist");
    expect(
      await screen.findByRole("heading", { name: "페이지를 찾을 수 없습니다" }),
    ).toBeInTheDocument();
  });

  it("라우트에서 에러가 나면 에러 화면과 재시도 버튼을 보여준다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const Boom = () => {
      throw new Error("boom");
    };
    const router = createMemoryRouter([
      { path: "/", Component: Boom, ErrorBoundary: RouteErrorBoundary },
    ]);
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "다시 시도" }),
    ).toBeInTheDocument();
  });
});
