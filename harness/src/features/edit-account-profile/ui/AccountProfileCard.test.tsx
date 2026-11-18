import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { toast } from "sonner";
import { SWRConfig } from "swr";

import { serverApi, serverApiV3 } from "@/shared/api";

import { AccountProfileCard } from "./AccountProfileCard";

import type { AccountProfileViewModel } from "@/entities/account";
import type * as SharedApi from "@/shared/api";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApi: { get: vi.fn() },
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

const SUB_IMAGE_URL = "https://cdn.bigbird.local/sub01.png";

/** 기본은 Master. Sub ID는 본인 정보에 담겨 온 이미지를 넘김. */
function setup(sub?: { profileImageUrl: string | null }) {
  const onClickWithdraw = vi.fn();
  render(
    <MemoryRouter initialEntries={["/mypage/account?tab=master"]}>
      <SWRConfig value={{ provider: () => new Map() }}>
        {sub ? (
          <AccountProfileCard
            accountType="sub"
            profile={profile}
            profileImageUrl={sub.profileImageUrl}
            onSaved={vi.fn()}
          />
        ) : (
          <AccountProfileCard
            profile={profile}
            onClickWithdraw={onClickWithdraw}
            onSaved={vi.fn()}
          />
        )}
      </SWRConfig>
    </MemoryRouter>,
  );
  return { onClickWithdraw, user: userEvent.setup() };
}

/** `POST /check/pw`: `result: true`가 현재 비밀번호 일치. */
function mockPasswordCheck(isMatched: boolean) {
  vi.mocked(serverApiV3.post).mockResolvedValue({ result: isMatched });
}

async function openEditDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "수정" }));
  return screen.findByRole("dialog", { name: "관리자 비밀번호 입력" });
}

beforeEach(() => {
  vi.mocked(serverApi.get).mockReset();
  vi.mocked(toast).mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(serverApiV3.get)
    .mockReset()
    .mockResolvedValue({ profileUrl: null });
  vi.mocked(serverApiV3.post).mockReset();
});

describe("AccountProfileCard", () => {
  it("처음에는 읽기 전용 보기이고 입력칸이 없다", () => {
    setup();
    expect(screen.getByText("master01")).toBeInTheDocument();
    expect(screen.getByText("*************")).toBeInTheDocument();
    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("old@bigbird.com")).toBeInTheDocument();
    expect(screen.queryByLabelText("비밀번호 변경")).toBeNull();
    expect(screen.getByRole("button", { name: "회원 탈퇴" })).toBeVisible();
  });

  it("Master 이미지는 GET /profile로 읽는다", async () => {
    setup();
    await waitFor(() =>
      expect(serverApiV3.get).toHaveBeenCalledWith("/mypage/account/profile"),
    );
  });

  it("회원 탈퇴 버튼은 부모에게 알린다", async () => {
    const { user, onClickWithdraw } = setup();
    await user.click(screen.getByRole("button", { name: "회원 탈퇴" }));
    expect(onClickWithdraw).toHaveBeenCalledOnce();
  });

  it("수정을 누르면 비밀번호 확인 다이얼로그가 뜨고, 입력 전에는 확인이 꺼져 있다", async () => {
    const { user } = setup();
    const dialog = await openEditDialog(user);
    expect(within(dialog).getByRole("button", { name: "확인" })).toBeDisabled();
    await user.type(
      within(dialog).getByPlaceholderText("비밀번호를 입력해주세요"),
      "pw",
    );
    expect(within(dialog).getByRole("button", { name: "확인" })).toBeEnabled();
  });

  it("비밀번호가 다르면 오류를 보이고 보기 상태에 머문다", async () => {
    mockPasswordCheck(false);
    const { user } = setup();
    const dialog = await openEditDialog(user);
    await user.type(
      within(dialog).getByPlaceholderText("비밀번호를 입력해주세요"),
      "wrong",
    );
    await user.click(within(dialog).getByRole("button", { name: "확인" }));
    expect(
      await within(dialog).findByText("비밀번호가 일치하지 않습니다."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("비밀번호 변경")).toBeNull();
  });

  it("확인 요청이 실패하면 오류 토스트를 띄우고 보기 상태에 머문다", async () => {
    vi.mocked(serverApiV3.post).mockRejectedValue(new Error("network"));
    const { user } = setup();
    const dialog = await openEditDialog(user);
    await user.type(
      within(dialog).getByPlaceholderText("비밀번호를 입력해주세요"),
      "pw",
    );
    await user.click(within(dialog).getByRole("button", { name: "확인" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.queryByLabelText("비밀번호 변경")).toBeNull();
  });

  it("비밀번호가 맞으면 같은 카드가 입력 모드가 되고, 취소하면 보기로 돌아가 다음 수정에서 다시 묻는다", async () => {
    mockPasswordCheck(true);
    const { user } = setup();
    const dialog = await openEditDialog(user);
    await user.type(
      within(dialog).getByPlaceholderText("비밀번호를 입력해주세요"),
      "right",
    );
    await user.click(within(dialog).getByRole("button", { name: "확인" }));

    expect(await screen.findByLabelText("비밀번호 변경")).toBeInTheDocument();
    expect(screen.getByLabelText("비밀번호 확인")).toBeInTheDocument();
    // 아이디·담당자명·가입일은 읽기 전용 행으로 함께 보임(PC·TAB).
    expect(screen.getAllByText("master01").length).toBeGreaterThan(0);
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.queryByLabelText("비밀번호 변경")).toBeNull();

    expect(await openEditDialog(user)).toBeInTheDocument();
  });

  describe("Sub ID", () => {
    it("보기·수정 모두 회사(Master) 기준인 GET /profile을 부르지 않는다", async () => {
      const { user } = setup({ profileImageUrl: SUB_IMAGE_URL });
      await user.click(screen.getByRole("button", { name: "수정" }));
      expect(await screen.findByLabelText("비밀번호 변경")).toBeInTheDocument();
      expect(serverApiV3.get).not.toHaveBeenCalledWith(
        "/mypage/account/profile",
      );
    });

    it("시안의 라벨로 읽기 전용 행을 보이고 휴대폰 번호·회원 탈퇴는 없다", () => {
      setup({ profileImageUrl: null });
      for (const label of [
        "담당자 명",
        "아이디 명",
        "비밀번호",
        "이메일 주소",
        "생성일",
      ]) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
      expect(screen.queryByText("휴대폰 번호")).toBeNull();
      expect(screen.queryByRole("button", { name: "회원 탈퇴" })).toBeNull();
    });

    it("수정은 비밀번호 확인 없이 바로 입력 모드가 되고 휴대폰 인증 행은 없다", async () => {
      const { user } = setup({ profileImageUrl: null });
      await user.click(screen.getByRole("button", { name: "수정" }));
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(serverApiV3.post).not.toHaveBeenCalled();

      expect(await screen.findByLabelText("비밀번호 변경")).toBeInTheDocument();
      expect(screen.getByLabelText("이메일 주소")).toHaveValue(
        "old@bigbird.com",
      );
      expect(screen.queryByRole("button", { name: "인증" })).toBeNull();
      expect(screen.queryByRole("button", { name: "회원 탈퇴" })).toBeNull();
    });
  });
});
