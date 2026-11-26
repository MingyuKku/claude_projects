import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, Link, Outlet, RouterProvider } from "react-router";

import { NavigationProgress } from "./NavigationProgress";

// 다음 화면의 loader가 끝나는 때를 테스트가 정함.
function renderWithSlowRoute() {
  let finishLoader: () => void = () => {};
  const slowLoader = () =>
    new Promise<null>((resolve) => {
      finishLoader = () => resolve(null);
    });
  const router = createMemoryRouter([
    {
      path: "/",
      element: (
        <>
          <NavigationProgress />
          <Outlet />
        </>
      ),
      children: [
        { index: true, element: <Link to="/next">다음 화면으로</Link> },
        {
          path: "next",
          loader: slowLoader,
          element: (
            <>
              <p>다음 화면</p>
              <Link to="/more">더 보기</Link>
            </>
          ),
        },
        { path: "more", loader: slowLoader, element: <p>더 보기 화면</p> },
      ],
    },
  ]);
  render(<RouterProvider router={router} />);
  return {
    finish: () => act(() => finishLoader()),
  };
}

function wait(ms: number) {
  return act(() => new Promise((resolve) => setTimeout(resolve, ms)));
}

function getBar() {
  return document.querySelector('[data-slot="navigation-progress"]');
}

describe("NavigationProgress", () => {
  it("250ms 안에 끝나는 이동에는 보이지 않는다", async () => {
    const user = userEvent.setup();
    const { finish } = renderWithSlowRoute();

    await user.click(screen.getByRole("link", { name: "다음 화면으로" }));
    await wait(100);
    await finish();
    await screen.findByText("다음 화면");
    await wait(300);

    expect(getBar()).toBeNull();
  });

  it("250ms를 넘기면 위쪽에 보이고, 이동이 끝나면 끝까지 채운 뒤 사라진다", async () => {
    const user = userEvent.setup();
    const { finish } = renderWithSlowRoute();

    await user.click(screen.getByRole("link", { name: "다음 화면으로" }));
    await wait(100);
    expect(getBar()).toBeNull();

    await wait(250);
    expect(getBar()).toHaveAttribute("data-state", "loading");

    await finish();
    await screen.findByText("다음 화면");
    const bar = getBar();
    expect(bar).toHaveAttribute("data-state", "finishing");

    fireEvent.transitionEnd(bar as Element, { propertyName: "opacity" });
    expect(getBar()).toBeNull();
  });

  it("사라지는 중에 새 이동이 시작되면 바를 새로 그린다", async () => {
    const user = userEvent.setup();
    const { finish } = renderWithSlowRoute();

    await user.click(screen.getByRole("link", { name: "다음 화면으로" }));
    await wait(300);
    await finish();
    await screen.findByText("다음 화면");
    const finishingBar = getBar();
    expect(finishingBar).toHaveAttribute("data-state", "finishing");

    await user.click(screen.getByRole("link", { name: "더 보기" }));
    const restartedBar = getBar();
    expect(restartedBar).toHaveAttribute("data-state", "loading");
    expect(restartedBar).not.toBe(finishingBar);
  });
});
