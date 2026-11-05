import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";

import { ROUTES } from "@/shared/config";

import { SocialCallbackScreen } from "./SocialCallbackScreen";

import type { SocialLoginOutcome } from "../model/schema";

function LoginProbe() {
  const { state } = useLocation();
  return <p>login page {JSON.stringify(state)}</p>;
}

function SnsLinkProbe() {
  const { state } = useLocation();
  return <p>link {JSON.stringify(state)}</p>;
}

function renderScreen(run: () => Promise<SocialLoginOutcome>) {
  const router = createMemoryRouter(
    [
      { path: "/cb", element: <SocialCallbackScreen completeLogin={run} /> },
      { path: ROUTES.main, element: <p>main page</p> },
      { path: ROUTES.login, element: <LoginProbe /> },
      { path: ROUTES.snsLink, element: <SnsLinkProbe /> },
    ],
    { initialEntries: ["/cb"] },
  );
  render(<RouterProvider router={router} />);
}

describe("SocialCallbackScreen", () => {
  it("goes to main on success", async () => {
    renderScreen(() => Promise.resolve({ status: "success" }));
    expect(await screen.findByText("main page")).toBeInTheDocument();
  });

  it("carries the identity to the link screen when the account is unregistered", async () => {
    renderScreen(() =>
      Promise.resolve({
        status: "needsLink",
        snsData: { platform: "kakao", snsLinkToken: "tok" },
      }),
    );
    expect(
      await screen.findByText(
        'link {"snsData":{"platform":"kakao","snsLinkToken":"tok"}}',
      ),
    ).toBeInTheDocument();
  });

  it("실패하면 로그인 실패 state와 함께 로그인 화면으로 간다", async () => {
    renderScreen(() => Promise.resolve({ status: "failed" }));
    expect(
      await screen.findByText('login page {"snsLoginFailed":true}'),
    ).toBeInTheDocument();
  });

  it("실행이 던져도 로그인 실패 state와 함께 로그인 화면으로 간다", async () => {
    renderScreen(() => Promise.reject(new Error("network")));
    expect(
      await screen.findByText('login page {"snsLoginFailed":true}'),
    ).toBeInTheDocument();
  });
});
