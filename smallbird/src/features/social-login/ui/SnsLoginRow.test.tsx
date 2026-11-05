import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";

import { ROUTES } from "@/shared/config";

import { loginWithApple } from "../api/complete-login";
import { SnsLoginRow } from "./SnsLoginRow";

vi.mock("../api/complete-login", () => ({ loginWithApple: vi.fn() }));
vi.mock("../lib/apple-authorize", () => ({
  preloadAppleSdk: vi.fn().mockResolvedValue(undefined),
}));

function SnsLinkProbe() {
  const { state } = useLocation();
  return <p>link {JSON.stringify(state)}</p>;
}

function renderRow() {
  const onErrorStart = vi.fn();
  const onFailLogin = vi.fn();
  const router = createMemoryRouter(
    [
      {
        path: ROUTES.login,
        element: (
          <SnsLoginRow onErrorStart={onErrorStart} onFailLogin={onFailLogin} />
        ),
      },
      { path: ROUTES.main, element: <p>main page</p> },
      { path: ROUTES.snsLink, element: <SnsLinkProbe /> },
    ],
    { initialEntries: [ROUTES.login] },
  );
  render(<RouterProvider router={router} />);
  return { onErrorStart, onFailLogin };
}

async function clickApple() {
  await userEvent.click(screen.getByRole("button", { name: /Apple|애플/ }));
}

beforeEach(() => vi.mocked(loginWithApple).mockReset());

describe("SnsLoginRow 애플 로그인", () => {
  it("성공하면 메인으로 간다", async () => {
    vi.mocked(loginWithApple).mockResolvedValueOnce({ status: "success" });
    renderRow();
    await clickApple();
    expect(await screen.findByText("main page")).toBeInTheDocument();
  });

  it("미가입이면 신원 토큰을 들고 SNS 연동 화면으로 간다", async () => {
    vi.mocked(loginWithApple).mockResolvedValueOnce({
      status: "needsLink",
      snsData: { platform: "apple", email: "a@b.co", snsLinkToken: "tok" },
    });
    renderRow();
    await clickApple();
    expect(await screen.findByText(/snsLinkToken/)).toHaveTextContent("tok");
  });

  it("팝업을 닫으면 화면에 머물고 안내를 띄우지 않는다", async () => {
    vi.mocked(loginWithApple).mockResolvedValueOnce({ status: "cancelled" });
    const { onErrorStart, onFailLogin } = renderRow();
    await clickApple();
    await vi.waitFor(() => expect(loginWithApple).toHaveBeenCalledOnce());
    expect(screen.queryByText("main page")).not.toBeInTheDocument();
    expect(onErrorStart).not.toHaveBeenCalled();
    expect(onFailLogin).not.toHaveBeenCalled();
  });

  it("로그인이 실패하면 화면에 머물고 로그인 실패로 알린다", async () => {
    vi.mocked(loginWithApple).mockResolvedValueOnce({ status: "failed" });
    const { onErrorStart, onFailLogin } = renderRow();
    await clickApple();
    await vi.waitFor(() => expect(onFailLogin).toHaveBeenCalledOnce());
    expect(onErrorStart).not.toHaveBeenCalled();
  });

  it("SDK 오류는 시작 실패 안내로 알린다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(loginWithApple).mockRejectedValueOnce(new Error("sdk"));
    const { onErrorStart } = renderRow();
    await clickApple();
    await vi.waitFor(() => expect(onErrorStart).toHaveBeenCalledOnce());
  });
});
