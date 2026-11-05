import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { ApiError, serverApiV3 } from "@/shared/api";

import { SocialLinkCard } from "./SocialLinkCard";

import type {
  SocialLinkRequest,
  SocialLinkViewModel,
  SocialProvider,
} from "@/entities/account";

type LinkRequesters = Record<SocialProvider, () => Promise<SocialLinkRequest>>;

// 테스트마다 필요한 SNS만 바꿔 끼우고, 나머지는 사용자가 창을 닫은 것처럼 취소로 둠.
function cancelledRequesters(): LinkRequesters {
  const cancel = () => Promise.resolve({ status: "cancelled" } as const);
  return { kakao: cancel, naver: cancel, google: cancel, apple: cancel };
}

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

// 네트워크 경계만 모킹함. `ApiError`는 실제 클래스를 써서 `readFailureReason`이 그대로 읽게 함.
vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    serverApiV3: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  };
});

beforeEach(() => {
  vi.mocked(toast).mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(serverApiV3.delete).mockReset();
  vi.mocked(serverApiV3.post).mockReset();
});

const LINKED: SocialLinkViewModel = { isLinked: true, email: null };
const UNLINKED: SocialLinkViewModel = { isLinked: false, email: null };

const AFTER_UNLINK_RESPONSE = {
  items: [
    { platform: "kakao", linked: false, email: null },
    { platform: "naver", linked: true, email: "n@example.com" },
    { platform: "google", linked: false, email: null },
    { platform: "apple", linked: false, email: null },
  ],
};

const AFTER_LINK_RESPONSE = {
  items: [
    { platform: "kakao", linked: true, email: "k@example.com" },
    { platform: "naver", linked: true, email: "n@example.com" },
    { platform: "google", linked: true, email: "g@example.com" },
    { platform: "apple", linked: false, email: null },
  ],
};

function setup(overrides: Partial<LinkRequesters> = {}) {
  const onChangeLinks = vi.fn();
  const links: Record<SocialProvider, SocialLinkViewModel> = {
    kakao: LINKED,
    naver: LINKED,
    google: UNLINKED,
    apple: UNLINKED,
  };
  render(
    <SocialLinkCard
      links={links}
      onChangeLinks={onChangeLinks}
      linkRequesters={{ ...cancelledRequesters(), ...overrides }}
    />,
  );
  return { user: userEvent.setup(), onChangeLinks };
}

describe("SocialLinkCard", () => {
  it("4개 SNS를 시안 순서로 보이고 연동 상태를 스위치로 나타낸다", () => {
    setup();
    const switches = screen.getAllByRole("switch");
    expect(switches.map((item) => item.getAttribute("aria-label"))).toEqual([
      "카카오 간편 로그인 연동",
      "네이버 간편 로그인 연동",
      "구글 간편 로그인 연동",
      "애플 간편 로그인 연동",
    ]);
    expect(switches.map((item) => item.getAttribute("aria-checked"))).toEqual([
      "true",
      "true",
      "false",
      "false",
    ]);
  });

  it("켰다가 공급자 창을 닫으면 안내 없이 값을 그대로 둔다", async () => {
    const { user } = setup();
    const toggle = screen.getByRole("switch", {
      name: "구글 간편 로그인 연동",
    });
    await user.click(toggle);
    await waitFor(() => expect(toggle).not.toBeDisabled());
    expect(toast).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(serverApiV3.post).not.toHaveBeenCalled();
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("켜면 인가 코드를 받아 연결 API를 부르고 최신 상태를 알린다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValueOnce(AFTER_LINK_RESPONSE);
    const requestLink = vi.fn().mockResolvedValue({
      status: "code",
      code: "google-code",
      redirectUri: "https://x.test/auth/google",
    });
    const { user, onChangeLinks } = setup({ google: requestLink });
    await user.click(
      screen.getByRole("switch", { name: "구글 간편 로그인 연동" }),
    );
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("구글 간편 로그인을 연동했습니다."),
    );
    expect(serverApiV3.post).toHaveBeenCalledWith(
      "/mypage/account/sns/google",
      { code: "google-code", redirectUri: "https://x.test/auth/google" },
    );
    expect(onChangeLinks).toHaveBeenCalledWith(
      expect.objectContaining({
        google: { isLinked: true, email: "g@example.com" },
      }),
    );
  });

  it("사용자가 로그인 창을 닫으면(토큰 없음) 연결 API도 안내도 없이 끝낸다", async () => {
    const { user, onChangeLinks } = setup({
      google: vi.fn().mockResolvedValue({ status: "cancelled" }),
    });
    await user.click(
      screen.getByRole("switch", { name: "구글 간편 로그인 연동" }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("switch", { name: "구글 간편 로그인 연동" }),
      ).toBeEnabled(),
    );
    expect(serverApiV3.post).not.toHaveBeenCalled();
    expect(onChangeLinks).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("공급자 화면으로 이동하는 SNS는 이동하는 동안 스위치를 잠그고 연결 API를 부르지 않는다", async () => {
    const { user, onChangeLinks } = setup({
      google: vi.fn().mockResolvedValue({ status: "redirecting" }),
    });
    const toggle = screen.getByRole("switch", {
      name: "구글 간편 로그인 연동",
    });
    await user.click(toggle);
    await waitFor(() => expect(toggle).toBeDisabled());
    expect(serverApiV3.post).not.toHaveBeenCalled();
    expect(onChangeLinks).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("공급자 화면에서 뒤로 가기로 돌아오면(bfcache 복원) 잠겼던 스위치를 다시 켠다", async () => {
    const { user } = setup({
      google: vi.fn().mockResolvedValue({ status: "redirecting" }),
    });
    const toggle = screen.getByRole("switch", {
      name: "구글 간편 로그인 연동",
    });
    await user.click(toggle);
    await waitFor(() => expect(toggle).toBeDisabled());

    act(() => {
      window.dispatchEvent(
        new PageTransitionEvent("pageshow", { persisted: true }),
      );
    });

    expect(toggle).toBeEnabled();
  });

  it("토큰을 받다가 실패하면 일반 실패로 안내한다", async () => {
    const { user, onChangeLinks } = setup({
      google: vi.fn().mockRejectedValue(new Error("SDK 로드 실패")),
    });
    await user.click(
      screen.getByRole("switch", { name: "구글 간편 로그인 연동" }),
    );
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "연동하지 못했습니다. 다시 시도해 주세요.",
      ),
    );
    expect(serverApiV3.post).not.toHaveBeenCalled();
    expect(onChangeLinks).not.toHaveBeenCalled();
  });

  it.each([
    [
      409,
      "SNS_ALREADY_LINKED",
      "다른 구글 계정이 이미 연동돼 있습니다. 해제한 뒤 다시 연동해 주세요.",
    ],
    [
      409,
      "SNS_LINKED_TO_OTHER_USER",
      "이미 다른 계정에 연동된 구글 계정입니다.",
    ],
    [400, "SNS_EMAIL_REQUIRED", "이메일 제공에 동의해야 연동할 수 있습니다."],
    [400, "INVALID_SNS_TOKEN", "연동하지 못했습니다. 다시 시도해 주세요."],
  ])(
    "연결이 %i %s로 실패하면 사유에 맞게 안내하고 상태는 그대로 둔다",
    async (status, reason, message) => {
      vi.mocked(serverApiV3.post).mockRejectedValueOnce(
        new ApiError(status, { result: false, reason }),
      );
      const { user, onChangeLinks } = setup({
        google: vi.fn().mockResolvedValue({
          status: "code",
          code: "google-code",
          redirectUri: "https://x.test/auth/google",
        }),
      });
      await user.click(
        screen.getByRole("switch", { name: "구글 간편 로그인 연동" }),
      );
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith(message));
      expect(onChangeLinks).not.toHaveBeenCalled();
    },
  );

  it("끄면 해제 확인 알럿을 열고, 확정하면 해제 API를 부르고 최신 상태를 알린다", async () => {
    vi.mocked(serverApiV3.delete).mockResolvedValueOnce(AFTER_UNLINK_RESPONSE);
    const { user, onChangeLinks } = setup();
    const toggle = screen.getByRole("switch", {
      name: "카카오 간편 로그인 연동",
    });
    await user.click(toggle);

    const dialog = screen.getByRole("alertdialog", {
      name: "간편 로그인 해제",
    });
    expect(dialog).toHaveTextContent(
      "카카오 간편 로그인 연동을 해제하시겠습니까?",
    );
    expect(toast).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "해제" }));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        "카카오 간편 로그인 연동을 해제했습니다.",
      ),
    );
    expect(serverApiV3.delete).toHaveBeenCalledWith(
      "/mypage/account/sns/kakao",
    );
    expect(onChangeLinks).toHaveBeenCalledWith(
      expect.objectContaining({
        kakao: { isLinked: false, email: null },
        naver: { isLinked: true, email: "n@example.com" },
      }),
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("이미 해제된 SNS면(404 SNS_NOT_LINKED) 안내하고 화면만 해제로 맞춘다", async () => {
    vi.mocked(serverApiV3.delete).mockRejectedValueOnce(
      new ApiError(404, { result: false, reason: "SNS_NOT_LINKED" }),
    );
    const { user, onChangeLinks } = setup();
    await user.click(
      screen.getByRole("switch", { name: "카카오 간편 로그인 연동" }),
    );
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "해제",
      }),
    );
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("이미 연동이 해제된 상태입니다."),
    );
    expect(onChangeLinks).toHaveBeenCalledWith(
      expect.objectContaining({ kakao: { isLinked: false, email: null } }),
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("해제에 실패하면 오류를 안내하고 상태는 그대로 둔다", async () => {
    vi.mocked(serverApiV3.delete).mockRejectedValueOnce(new ApiError(500, {}));
    const { user, onChangeLinks } = setup();
    await user.click(
      screen.getByRole("switch", { name: "카카오 간편 로그인 연동" }),
    );
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "해제",
      }),
    );
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "해제하지 못했습니다. 다시 시도해 주세요.",
      ),
    );
    expect(onChangeLinks).not.toHaveBeenCalled();
  });

  it("알럿에서 취소하면 안내 없이 닫는다", async () => {
    const { user } = setup();
    await user.click(
      screen.getByRole("switch", { name: "네이버 간편 로그인 연동" }),
    );
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(toast).not.toHaveBeenCalled();
    expect(serverApiV3.delete).not.toHaveBeenCalled();
  });
});
