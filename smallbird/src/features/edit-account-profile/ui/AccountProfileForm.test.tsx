import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { toast } from "sonner";
import { SWRConfig } from "swr";

import { ApiError, serverApi, serverApiV3 } from "@/shared/api";

import { AccountProfileForm } from "./AccountProfileForm";

import type { ProfileImageSource } from "../api/use-profile-image";
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

const NEW_PASSWORD = "Wq!9a2k7xZ";

function setup(
  {
    subProfileImageUrl,
    ...props
  }: {
    onClickWithdraw?: () => void;
    accountType?: "master" | "sub";
    /** Sub ID 본인 정보에 담겨 온 이미지. */
    subProfileImageUrl?: string | null;
  } = {},
  initialEntry = "/mypage/account?tab=master",
) {
  const onSaved = vi.fn();
  const imageSource: ProfileImageSource =
    props.accountType === "sub"
      ? { accountType: "sub", url: subProfileImageUrl ?? null }
      : { accountType: "master" };
  const { container } = render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SWRConfig value={{ provider: () => new Map() }}>
        <AccountProfileForm
          profile={profile}
          imageSource={imageSource}
          onSaved={onSaved}
          {...props}
        />
      </SWRConfig>
    </MemoryRouter>,
  );
  return { onSaved, container, user: userEvent.setup() };
}

const CERT_TOKEN = {
  trCert: "TR",
  trUrl: "https://dev.bigbird.co.kr/cert/success",
  trAdd: "Y",
};

/** 본인인증: init(v3)은 토큰, decrypte(v2)는 넘긴 결과. */
function mockCert(decrypted: Record<string, unknown>) {
  vi.mocked(serverApi.get).mockResolvedValue(decrypted);
  vi.mocked(serverApiV3.get).mockImplementation((path: string) =>
    Promise.resolve(
      path === "/mypage/cert/init" ? CERT_TOKEN : { profileUrl: null },
    ),
  );
}

function stubMedia(...matching: string[]) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: matching.includes(query),
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  sessionStorage.clear();
});

beforeEach(() => {
  vi.mocked(serverApi.get).mockReset();
  // jsdom은 form 제출(페이지 이동)을 구현하지 않음.
  vi.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(() => {});
  vi.mocked(toast).mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(serverApiV3.get)
    .mockReset()
    .mockResolvedValue({ profileUrl: null });
  vi.mocked(serverApiV3.put).mockReset().mockResolvedValue({ result: true });
  vi.mocked(serverApiV3.post).mockReset();
  vi.mocked(serverApiV3.patch).mockReset();
});

describe("AccountProfileForm", () => {
  it("바꾼 것이 없으면 저장할 수 없다", () => {
    setup();
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
  });

  describe("휴대폰 본인인증", () => {
    const verified = {
      result: "success",
      certIdx: 120,
      phoneNumber: "01098765432",
      name: "홍길동",
    };

    async function verifyByPopup(user: ReturnType<typeof userEvent.setup>) {
      await user.click(screen.getByRole("button", { name: "인증" }));
      await waitFor(() => expect(window.open).toHaveBeenCalled());
      act(() => window.cert_result?.({ rec_cert: "REC", certNum: "NUM" }));
    }

    it("PC는 팝업으로 인증하고, 결과 번호를 보인 뒤 저장에서 새 certIdx로 보낸다", async () => {
      mockCert(verified);
      vi.spyOn(window, "open").mockReturnValue({} as Window);
      const { user, onSaved } = setup();
      expect(screen.getByLabelText("휴대폰 번호")).toHaveAttribute("readonly");

      await verifyByPopup(user);

      expect(
        await screen.findByText("본인 인증에 성공하였습니다."),
      ).toBeInTheDocument();
      expect(serverApiV3.get).toHaveBeenCalledWith("/mypage/cert/init", {
        params: { trUrl: `${window.location.origin}/cert/success` },
      });
      expect(serverApi.get).toHaveBeenCalledWith("/cert/decrypte", {
        params: { rec_cert: "REC", certNum: "NUM" },
      });
      expect(screen.getByLabelText("휴대폰 번호")).toHaveValue("010-9876-5432");

      await user.click(screen.getByRole("button", { name: "저장" }));
      await waitFor(() => expect(onSaved).toHaveBeenCalled());
      expect(serverApiV3.put).toHaveBeenCalledWith("/mypage/account/modify", {
        certIdx: 120,
        email: "old@bigbird.com",
      });
    });

    it("이미 등록된 번호면 안내하고 번호를 바꾸지 않는다", async () => {
      mockCert({ result: "exist" });
      vi.spyOn(window, "open").mockReturnValue({} as Window);
      const { user } = setup();

      await verifyByPopup(user);

      expect(
        await screen.findByText("이미 등록된 사용자입니다."),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("휴대폰 번호")).toHaveValue("010-1234-5678");
      expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
    });

    it("팝업이 막히면 차단 해제를 안내한다", async () => {
      mockCert(verified);
      vi.spyOn(window, "open").mockReturnValue(null);
      const { user } = setup();
      await user.click(screen.getByRole("button", { name: "인증" }));
      expect(
        await screen.findByText(
          "브라우저에서 팝업 차단을 해제한 뒤 다시 시도해 주세요.",
        ),
      ).toBeInTheDocument();
    });

    it("터치 기기는 입력 중인 이메일을 보관하고 지금 화면으로 돌아오게 KMC로 이동한다", async () => {
      stubMedia("(pointer: coarse)");
      mockCert(verified);
      const open = vi.spyOn(window, "open");
      const { user } = setup();
      const email = screen.getByLabelText("이메일");
      await user.clear(email);
      await user.type(email, "draft@bigbird.com");

      await user.click(screen.getByRole("button", { name: "인증" }));

      await waitFor(() =>
        expect(HTMLFormElement.prototype.submit).toHaveBeenCalled(),
      );
      expect(open).not.toHaveBeenCalled();
      expect(sessionStorage.getItem("kmc-return-path")).toBe(
        "/mypage/account?tab=master",
      );
      expect(
        JSON.parse(sessionStorage.getItem("account-profile-draft") ?? "{}"),
      ).toEqual({ email: "draft@bigbird.com" });
    });

    it("KMC에서 돌아오면 보관한 이메일을 되살리고 결과를 한 번만 복호화한다", async () => {
      mockCert(verified);
      sessionStorage.setItem(
        "account-profile-draft",
        JSON.stringify({ email: "draft@bigbird.com" }),
      );
      setup({}, "/mypage/account?tab=master&rec_cert=REC&certNum=NUM");

      expect(
        await screen.findByText("본인 인증에 성공하였습니다."),
      ).toBeInTheDocument();
      expect(serverApi.get).toHaveBeenCalledTimes(1);
      expect(screen.getByLabelText("이메일")).toHaveValue("draft@bigbird.com");
      expect(sessionStorage.getItem("account-profile-draft")).toBeNull();
    });
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
    it("Sub 경로로 이메일·비밀번호를 저장하고 회사(Master) 기준인 GET /profile은 부르지 않는다", async () => {
      const { user, onSaved } = setup({ accountType: "sub" });
      const email = screen.getByLabelText("이메일 주소");
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
      expect(serverApiV3.get).not.toHaveBeenCalledWith(
        "/mypage/account/profile",
      );
    });

    it.each([
      {
        subProfileImageUrl: "https://cdn.bigbird.local/sub01.png",
        method: "patch",
      },
      { subProfileImageUrl: null, method: "post" },
    ] as const)(
      "본인 이미지 유무로 등록·수정을 가른다(이미지 $subProfileImageUrl → $method)",
      async ({ subProfileImageUrl, method }) => {
        vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview");
        vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
        vi.mocked(serverApiV3[method]).mockResolvedValue({ result: true });
        const { user, onSaved, container } = setup({
          accountType: "sub",
          subProfileImageUrl,
        });
        await user.upload(
          container.querySelector<HTMLInputElement>("input[type=file]")!,
          new File(["image"], "face.png", { type: "image/png" }),
        );
        await user.click(screen.getByRole("button", { name: "저장" }));

        await waitFor(() => expect(onSaved).toHaveBeenCalled());
        expect(serverApiV3[method]).toHaveBeenCalledWith(
          "/mypage/account/sub/profile",
          expect.any(FormData),
        );
      },
    );
  });
});
