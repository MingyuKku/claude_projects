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

  it("서버를 부르기 전에 아이디를 먼저 요구한다", async () => {
    renderForm();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "로그인" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "아이디를 입력해 주세요.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("관리자가 로그인하면 메인 화면으로 이동한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { result: true, authority: "MASTER", userIdx: 1 }),
    );
    renderForm();
    await submit("tester", "pw1234!");

    expect(await screen.findByText("main page")).toBeInTheDocument();
    const body = fetchMock.mock.calls[0]?.[1]?.body;
    expect(body).toBeInstanceOf(FormData);
  });

  it("엔터 키로 폼을 제출해 로그인한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { result: true, authority: "MASTER", userIdx: 1 }),
    );
    renderForm();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("아이디"), "tester");
    await user.type(screen.getByLabelText("비밀번호"), "pw1234!{Enter}");

    expect(await screen.findByText("main page")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("서버가 result=false로 답하면 불일치 문구를 보여 준다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { result: false }));
    renderForm();
    await submit("tester", "wrong");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "입력하신 회원정보를 찾을 수 없습니다.",
    );
  });

  it("401 탈퇴 계정은 해당 문구로 보여 준다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { reason: "accountExited" }));
    renderForm();
    await submit("tester", "pw");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "탈퇴한 회원입니다.",
    );
  });

  it("잠긴 계정은 문구 대신 부모에게 알린다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(401, { reason: "accountRejected" }),
    );
    const { onAccountLocked } = renderForm();
    await submit("tester", "pw");

    await waitFor(() => expect(onAccountLocked).toHaveBeenCalledWith("tester"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("만료 계정은 자격 증명을 보관하고 /expired로 보낸다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(403, { reason: "ACCOUNT_EXPIRED" }),
    );
    renderForm();
    await submit("tester", "pw");

    expect(await screen.findByText("expired page")).toBeInTheDocument();
    expect(readLoginCredential()).toEqual({ id: "tester", password: "pw" });
  });

  it("아이디만 채우면 비밀번호를 요구한다", async () => {
    renderForm();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("아이디"), "tester");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "비밀번호를 입력해 주세요.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("입력을 고치면 문구를 지운다", async () => {
    renderForm();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "로그인" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await user.type(screen.getByLabelText("아이디"), "t");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("403 noAccount는 해당 문구로 보여 준다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(403, { reason: "ACCOUNT_BANNED" }),
    );
    renderForm();
    await submit("tester", "pw");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "계정이 없거나 탈퇴한 회원입니다.",
    );
  });

  it("잠금 남은 시간(분)을 보여 준다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(401, {
        reason: "accountLocked",
        time: new Date(Date.now() + 5 * 60_000 + 5_000).toISOString(),
      }),
    );
    renderForm();
    await submit("tester", "pw");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "계정이 잠김 상태입니다. 5분 뒤에 다시 로그인을 시도해주세요.",
    );
  });

  it("휴면 만료 계정은 법적 고지를 보여 준다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(401, {
        reason: "accountDestroyed",
        time: "2025-03-04T05:06:00",
      }),
    );
    renderForm();
    await submit("tester", "pw");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "정보통신망 이용촉진 및 정보보호 등에 관한 법률 제29조",
    );
  });

  it("응답 없이 요청이 실패하면 일반 문구를 보여 준다", async () => {
    fetchMock.mockRejectedValue(new TypeError("network"));
    renderForm();
    await submit("tester", "pw");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "오류가 발생했습니다. 잠시후 다시 시도해 주세요.",
    );
  });

  it("요청 중에는 제출 버튼을 비활성화한다", async () => {
    let resolveFetch: (response: Response) => void = () => undefined;
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    renderForm();
    await submit("tester", "pw");

    expect(
      await screen.findByRole("button", { name: "로그인 중" }),
    ).toBeDisabled();
    resolveFetch(jsonResponse(200, { result: true, authority: "MASTER" }));
    expect(await screen.findByText("main page")).toBeInTheDocument();
  });
});
