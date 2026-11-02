import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";

import { ROUTES } from "@/shared/config";

import { SocialCallbackScreen } from "./SocialCallbackScreen";

import type { SocialLoginOutcome } from "../model/schema";

function SnsLinkProbe() {
  const { state } = useLocation();
  return <p>link {JSON.stringify(state)}</p>;
}

function renderScreen(run: () => Promise<SocialLoginOutcome>) {
  const router = createMemoryRouter(
    [
      { path: "/cb", element: <SocialCallbackScreen completeLogin={run} /> },
      { path: ROUTES.main, element: <p>main page</p> },
      { path: ROUTES.login, element: <p>login page</p> },
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
        snsData: { platform: "kakao", uid: "1" },
      }),
    );
    expect(
      await screen.findByText(
        'link {"snsData":{"platform":"kakao","uid":"1"}}',
      ),
    ).toBeInTheDocument();
  });

  it("returns to login on failure or when the run throws", async () => {
    renderScreen(() => Promise.reject(new Error("sdk missing")));
    expect(await screen.findByText("login page")).toBeInTheDocument();
  });
});
