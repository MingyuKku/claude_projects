import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";

import { ApiError, memberApi } from "@/shared/api";

import { ChangePasswordForm } from "./ChangePasswordForm";

import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof SharedApi>();
  return { ...actual, memberApi: { ...actual.memberApi, patch: vi.fn() } };
});

const VALID_PASSWORD = "Zebra7391!";

function setup() {
  const onClickLogin = vi.fn();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <ChangePasswordForm onClickLogin={onClickLogin} />
    </SWRConfig>,
  );
  return { onClickLogin, user: userEvent.setup() };
}

describe("ChangePasswordForm", () => {
  beforeEach(() => {
    vi.mocked(memberApi.patch).mockReset();
  });

  it("keeps submit disabled until both fields are valid and equal", async () => {
    const { user } = setup();
    const submit = screen.getByRole("button", { name: "변경하기" });
    expect(submit).toBeDisabled();

    await user.type(
      screen.getByLabelText("비밀번호", { exact: true }),
      VALID_PASSWORD,
    );
    await user.type(screen.getByLabelText("비밀번호 확인"), "different");
    expect(submit).toBeDisabled();
    expect(
      screen.getByText("일치하지 않습니다. 다시 입력해 주세요."),
    ).toBeInTheDocument();
  });

  it("submits the new password and shows the completion dialog", async () => {
    vi.mocked(memberApi.patch).mockResolvedValue({ result: "success" });
    const { user, onClickLogin } = setup();

    await user.type(
      screen.getByLabelText("비밀번호", { exact: true }),
      VALID_PASSWORD,
    );
    await user.type(screen.getByLabelText("비밀번호 확인"), VALID_PASSWORD);
    await user.click(screen.getByRole("button", { name: "변경하기" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(memberApi.patch).toHaveBeenCalledWith(
      expect.stringMatching(/^\/changePw\//),
      { pw: VALID_PASSWORD },
    );

    await user.click(screen.getByRole("button", { name: /로그인하러 가기/ }));
    expect(onClickLogin).toHaveBeenCalledOnce();
  });

  it("maps a server failure reason to a message", async () => {
    vi.mocked(memberApi.patch).mockRejectedValue(
      new ApiError(400, { message: "time out" }),
    );
    const { user } = setup();

    await user.type(
      screen.getByLabelText("비밀번호", { exact: true }),
      VALID_PASSWORD,
    );
    await user.type(screen.getByLabelText("비밀번호 확인"), VALID_PASSWORD);
    await user.click(screen.getByRole("button", { name: "변경하기" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "비밀번호 변경에 실패하였습니다(5분 내에 비밀번호를 바꿔주세요)",
      ),
    );
  });
});
