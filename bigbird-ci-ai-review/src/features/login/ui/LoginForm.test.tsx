import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";

import { readLoginCredential } from "@/entities/session";
import { ROUTES } from "@/shared/config";

import { LoginForm } from "./LoginForm";

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status });
}

function renderForm(onAccountLocked = vi.fn()) {
  const router = createMemoryRouter(
    [
      {
        path: ROUTES.login,
        element: <LoginForm onAccountLocked={onAccountLocked} />,
      },
      { path: ROUTES.main, element: <p>main page</p> },
      { path: ROUTES.expired, element: <p>expired page</p> },
    ],
    { initialEntries: [ROUTES.login] },
  );
  render(<RouterProvider router={router} />);
  return { onAccountLocked };
}

async function submit(id: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("아이디"), id);
  await user.type(screen.getByLabelText("비밀번호"), password);
  await user.click(screen.getByRole("button", { name: "로그인" }));
}

describe("LoginForm", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("asks for an id before calling the server", async () => {
    renderForm();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "로그인" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "아이디를 입력해 주세요.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("goes to the main screen when an admin logs in", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { result: true, authority: "MASTER", userIdx: 1 }),
    );
    renderForm();
    await submit("tester", "pw1234!");

    expect(await screen.findByText("main page")).toBeInTheDocument();
    const body = fetchMock.mock.calls[0]?.[1]?.body;
    expect(body).toBeInstanceOf(FormData);
  });

  it("shows the mismatch message when the server answers result=false", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { result: false }));
    renderForm();
    await submit("tester", "wrong");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "아이디 또는 비밀번호가 일치하지 않습니다.",
    );
  });

  it("maps a 401 exited account to its message", async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { reason: "accountExited" }));
    renderForm();
    await submit("tester", "pw");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "탈퇴한 회원입니다.",
    );
  });

  it("reports a locked account to the parent instead of showing text", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(401, { reason: "accountRejected" }),
    );
    const { onAccountLocked } = renderForm();
    await submit("tester", "pw");

    await waitFor(() => expect(onAccountLocked).toHaveBeenCalledWith("tester"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("sends an expired account to /expired and stashes the credential", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(403, { reason: "ACCOUNT_EXPIRED" }),
    );
    renderForm();
    await submit("tester", "pw");

    expect(await screen.findByText("expired page")).toBeInTheDocument();
    expect(readLoginCredential()).toEqual({ id: "tester", password: "pw" });
  });
});
