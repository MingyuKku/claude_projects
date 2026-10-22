import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { verifyCurrentPassword } from "@/entities/account";
import { hardNavigate } from "@/shared/lib";

import { exitAccount } from "../api/withdraw-api";
import { WithdrawFlow } from "./WithdrawFlow";

import type * as EntitiesAccount from "@/entities/account";
import type * as SharedLib from "@/shared/lib";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));
vi.mock("@/entities/account", async (importOriginal) => ({
  ...(await importOriginal<typeof EntitiesAccount>()),
  verifyCurrentPassword: vi.fn(),
}));
vi.mock("@/entities/session", () => ({
  useLogout: () => ({
    trigger: vi.fn().mockResolvedValue(undefined),
    isMutating: false,
  }),
}));
vi.mock("@/shared/lib", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedLib>()),
  hardNavigate: vi.fn(),
}));
vi.mock("../api/withdraw-api");

beforeEach(() => {
  vi.mocked(toast.error).mockReset();
  vi.mocked(hardNavigate).mockReset();
  vi.mocked(verifyCurrentPassword).mockReset();
  vi.mocked(exitAccount).mockReset();
});

async function openPasswordStep(variant: "dialog" | "screen") {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(<WithdrawFlow variant={variant} onClose={onClose} />);
  await user.click(
    await screen.findByRole("button", { name: "동의 및 탈퇴하기" }),
  );
  return { user, onClose };
}

describe.each(["dialog", "screen"] as const)("WithdrawFlow(%s)", (variant) => {
  it("동의하면 비밀번호 확인 단계로 가고, 입력 전에는 탈퇴할 수 없다", async () => {
    await openPasswordStep(variant);
    expect(
      screen.getByText("회원정보 탈퇴를 위해 비밀번호를 입력해주세요."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "탈퇴하기" })).toBeDisabled();
  });

  it("비밀번호가 다르면 오류 문구를 보이고 입력값은 지우지 않는다", async () => {
    vi.mocked(verifyCurrentPassword).mockResolvedValue(false);
    const { user } = await openPasswordStep(variant);
    const input = screen.getByLabelText("비밀번호");
    await user.type(input, "wrong");
    await user.click(screen.getByRole("button", { name: "탈퇴하기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "비밀번호가 일치하지 않습니다.",
    );
    expect(input).toHaveValue("wrong");
    expect(exitAccount).not.toHaveBeenCalled();
  });

  it("요청이 실패하면 오류 토스트를 띄운다", async () => {
    vi.mocked(verifyCurrentPassword).mockRejectedValue(new Error("network"));
    const { user } = await openPasswordStep(variant);
    await user.type(screen.getByLabelText("비밀번호"), "pw");
    await user.click(screen.getByRole("button", { name: "탈퇴하기" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "회원 탈퇴를 처리하지 못했습니다. 다시 시도해 주세요.",
      ),
    );
  });

  it("탈퇴가 끝나면 완료 안내를 보이고 확인을 누르면 로그인 화면으로 이동한다", async () => {
    vi.mocked(verifyCurrentPassword).mockResolvedValue(true);
    vi.mocked(exitAccount).mockResolvedValue({ result: true });
    const { user } = await openPasswordStep(variant);
    await user.type(screen.getByLabelText("비밀번호"), "pw");
    await user.click(screen.getByRole("button", { name: "탈퇴하기" }));

    const done = await screen.findByRole("alertdialog", {
      name: "회원 탈퇴가 완료되었습니다.",
    });
    await user.click(within(done).getByRole("button", { name: "확인" }));
    await waitFor(() => expect(hardNavigate).toHaveBeenCalledWith("/login"));
  });

  it("취소하면 흐름을 닫는다", async () => {
    const { user, onClose } = await openPasswordStep(variant);
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(onClose).toHaveBeenCalled();
  });
});
