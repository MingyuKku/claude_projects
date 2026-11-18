import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { SWRConfig } from "swr";

import { stashLoginCredential } from "@/entities/session";
import { ApiError, serverApi } from "@/shared/api";

import { ExpiredPasswordForm } from "./ExpiredPasswordForm";

import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof SharedApi>();
  return {
    ...actual,
    serverApi: {
      ...actual.serverApi,
      put: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
    },
  };
});

const OLD_PASSWORD = "Oldpass1!";
const NEW_PASSWORD = "Newpass1!";

function setup() {
  stashLoginCredential({ id: "user1", password: OLD_PASSWORD });
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <MemoryRouter>
        <ExpiredPasswordForm />
      </MemoryRouter>
    </SWRConfig>,
  );
  return userEvent.setup();
}

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("현재 비밀번호"), OLD_PASSWORD);
  await user.type(
    screen.getByLabelText("새 비밀번호", { exact: true }),
    NEW_PASSWORD,
  );
  await user.type(screen.getByLabelText("새 비밀번호 확인"), NEW_PASSWORD);
}

describe("ExpiredPasswordForm", () => {
  beforeEach(() => {
    vi.mocked(serverApi.put).mockReset();
    vi.mocked(serverApi.get).mockReset();
    vi.mocked(serverApi.post).mockReset();
  });

  it("flags a current password that differs from the one just used to log in", async () => {
    const user = setup();
    await user.type(screen.getByLabelText("현재 비밀번호"), "wrong");
    expect(
      screen.getByText("현재 비밀번호가 아닙니다. 다시 입력해주세요."),
    ).toBeInTheDocument();
  });

  it("rejects forbidden words in the new password", async () => {
    const user = setup();
    await user.type(
      screen.getByLabelText("새 비밀번호", { exact: true }),
      "Bigbird123!",
    );
    expect(
      screen.getByText(
        "최소 8자리 이상(영문,숫자,특수문자 포함 8~20자로 입력해주세요)",
      ),
    ).toBeInTheDocument();
  });

  it("changes the password and shows the completion screen", async () => {
    vi.mocked(serverApi.put).mockResolvedValue({ result: true });
    const user = setup();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "변경하기" }));

    expect(await screen.findByText("비밀번호 변경 완료")).toBeInTheDocument();
    expect(serverApi.put).toHaveBeenCalledWith("/login/expire", {
      id: "user1",
      originPW: OLD_PASSWORD,
      newPW: NEW_PASSWORD,
      newPWCheck: NEW_PASSWORD,
    });
  });

  it("maps a server failure reason to a message", async () => {
    vi.mocked(serverApi.put).mockRejectedValue(
      new ApiError(400, { reason: "NOT REACHED SEMI ANNUAL." }),
    );
    const user = setup();
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "변경하기" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "6개월이 지나지 않았습니다.",
      ),
    );
  });

  it("postpones the change by calling the delay endpoint and logging in again", async () => {
    vi.mocked(serverApi.get).mockResolvedValue(undefined);
    vi.mocked(serverApi.post).mockResolvedValue({
      result: true,
      authority: "MASTER",
    });
    const user = setup();
    await user.click(screen.getByRole("button", { name: "다음에 변경하기" }));

    await waitFor(() =>
      expect(serverApi.get).toHaveBeenCalledWith("/login/delay-pw/user1"),
    );
    await waitFor(() => expect(serverApi.post).toHaveBeenCalled());
  });
});
