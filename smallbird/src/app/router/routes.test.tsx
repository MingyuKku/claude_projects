import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { ROUTES } from "@/shared/config";

import { RouteErrorBoundary } from "../providers/ErrorBoundary";
import { routes } from "./routes";

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

describe("app router", () => {
  it("/welcome 은 가입 완료 화면을 보여준다", async () => {
    renderAt(ROUTES.welcome);
    expect(
      await screen.findByText("광고주 회원가입을 검토 중입니다.", {
        exact: false,
      }),
    ).toBeInTheDocument();
  });

  it("/find/email-sent 는 재설정 링크 안내를 보여준다", async () => {
    renderAt(ROUTES.findEmailSent);
    expect(
      await screen.findByText("등록된 이메일로 비밀번호 재설정 링크를", {
        exact: false,
      }),
    ).toBeInTheDocument();
  });

  it("/join 은 가입 화면을 보여준다", async () => {
    renderAt(ROUTES.join);
    expect(
      await screen.findByText("기업 담당자 본인인증이 필요합니다.", {
        exact: false,
      }),
    ).toBeInTheDocument();
  });

  it("/logout 은 로그인 화면을 보여준다", async () => {
    renderAt(ROUTES.logout);
    expect(
      await screen.findByRole("button", { name: "로그인" }),
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
