import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { SWRConfig } from "swr";

import { ApiError, serverApiV3 } from "@/shared/api";

import { AccountProfileForm } from "./AccountProfileForm";

import type { AccountProfileViewModel } from "@/entities/account";
import type * as SharedApi from "@/shared/api";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApiV3: { get: vi.fn(), put: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const profile: AccountProfileViewModel = {
  identifier: "master01",
  name: "홍길동",
  phone: "01012345678",
  email: "old@bigbird.com",
  joinedAt: new Date("2024-01-01T10:00:00"),
  certIdx: 87,
};

const NEW_PASSWORD = "Wq!9a2k7xZ";

function setup(
  props: {
    onClickWithdraw?: () => void;
    accountType?: "master" | "sub";
  } = {},
) {
  const onSaved = vi.fn();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <AccountProfileForm profile={profile} onSaved={onSaved} {...props} />
    </SWRConfig>,
  );
  return { onSaved, user: userEvent.setup() };
}

beforeEach(() => {
  vi.mocked(toast).mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(serverApiV3.get)
    .mockReset()
    .mockResolvedValue({ profileUrl: null });
  vi.mocked(serverApiV3.put).mockReset().mockResolvedValue({ result: true });
});

describe("AccountProfileForm", () => {
  it("바꾼 것이 없으면 저장할 수 없다", () => {
    setup();
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
  });

  it("휴대폰은 읽기 전용이고 인증은 준비 중 안내만 한다", async () => {
    const { user } = setup();
    expect(screen.getByLabelText("휴대폰 번호")).toHaveAttribute("readonly");
    await user.click(screen.getByRole("button", { name: "인증" }));
    expect(toast).toHaveBeenCalledWith("준비 중인 기능입니다.");
  });

  it("확인 칸이 다르면 불일치 문구를 보이고 저장할 수 없다", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText("비밀번호 변경"), NEW_PASSWORD);
    await user.type(screen.getByLabelText("비밀번호 확인"), "different");
    expect(
      screen.getByText("비밀번호가 일치하지 않습니다."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
  });

  it("아이디를 포함한 비밀번호는 오류 문구를 보인다", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText("비밀번호 변경"), "master01!Ab");
    expect(
      screen.getByText("아이디를 포함한 비밀번호 불가"),
    ).toBeInTheDocument();
  });

  it("이메일을 바꿔 저장하면 본인인증 번호와 함께 보내고 알린다", async () => {
    const { user, onSaved } = setup();
    const email = screen.getByLabelText("이메일");
    await user.clear(email);
    await user.type(email, "new@bigbird.com");
    await user.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() =>
      expect(serverApiV3.put).toHaveBeenCalledWith("/mypage/account/modify", {
        certIdx: 87,
        email: "new@bigbird.com",
      }),
    );
    await waitFor(() => expect(toast).toHaveBeenCalledWith("저장되었습니다."));
    expect(onSaved).toHaveBeenCalled();
  });

  it("비밀번호 변경이 5분 제한에 걸리면 안내하고 입력을 지키며 다시 읽지 않는다", async () => {
    vi.mocked(serverApiV3.put).mockRejectedValue(
      new ApiError(429, { result: false, reason: "wait" }),
    );
    const { user, onSaved } = setup();
    await user.type(screen.getByLabelText("비밀번호 변경"), NEW_PASSWORD);
    await user.type(screen.getByLabelText("비밀번호 확인"), NEW_PASSWORD);
    await user.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "5분 뒤에 다시 변경 요청해주세요",
      ),
    );
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByLabelText("비밀번호 변경")).toHaveValue(NEW_PASSWORD);
  });

  it("취소하면 입력을 불러온 값으로 되돌린다", async () => {
    const { user } = setup();
    const email = screen.getByLabelText("이메일");
    await user.clear(email);
    await user.type(email, "other@bigbird.com");
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(email).toHaveValue("old@bigbird.com");
  });

  it("회원 탈퇴 버튼은 핸들러를 넘길 때만 그린다", () => {
    setup();
    expect(screen.queryByRole("button", { name: "회원 탈퇴" })).toBeNull();
  });

  it("핸들러를 넘기면 회원 탈퇴 버튼을 눌렀을 때 호출한다", async () => {
    const onClickWithdraw = vi.fn();
    const { user } = setup({ onClickWithdraw });
    await user.click(screen.getByRole("button", { name: "회원 탈퇴" }));
    expect(onClickWithdraw).toHaveBeenCalledTimes(1);
  });

  describe("Sub ID", () => {
    it("Sub 경로로 이메일·비밀번호를 저장하고 현재 이미지는 GET /profile로 읽는다", async () => {
      const { user, onSaved } = setup({ accountType: "sub" });
      const email = screen.getByLabelText("이메일");
      await user.clear(email);
      await user.type(email, "new@bigbird.com");
      await user.type(screen.getByLabelText("비밀번호 변경"), NEW_PASSWORD);
      await user.type(screen.getByLabelText("비밀번호 확인"), NEW_PASSWORD);
      await user.click(screen.getByRole("button", { name: "저장" }));

      await waitFor(() => expect(onSaved).toHaveBeenCalled());
      expect(serverApiV3.put).toHaveBeenCalledWith(
        "/mypage/account/sub/email",
        { email: "new@bigbird.com" },
      );
      expect(serverApiV3.put).toHaveBeenCalledWith("/mypage/account/sub/pw", {
        pw: NEW_PASSWORD,
      });
      expect(serverApiV3.get).toHaveBeenCalledWith("/mypage/account/profile");
    });
  });
});
