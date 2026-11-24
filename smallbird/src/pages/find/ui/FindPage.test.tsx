import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";

import { ApiError, authApi, memberApi } from "@/shared/api";

import { FindPage } from "./FindPage";

import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof SharedApi>();
  return {
    ...actual,
    authApi: { ...actual.authApi, post: vi.fn() },
    memberApi: { ...actual.memberApi, post: vi.fn() },
  };
});

const memberPost = vi.mocked(memberApi.post);
const authPost = vi.mocked(authApi.post);

function renderPage(path = "/find") {
  const router = createMemoryRouter(
    [
      { path: "/find", element: <FindPage /> },
      { path: "/login", element: <p>로그인 화면</p> },
      { path: "/find/email-sent", element: <p>메일 발송 화면</p> },
      { path: "/changePw", element: <p>비밀번호 변경 화면</p> },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return { router, user: userEvent.setup() };
}

type User = ReturnType<typeof userEvent.setup>;

async function chooseMethod(user: User, name: string) {
  await user.click(screen.getByRole("button", { name }));
}

/** 이름과 이메일을 채우고 인증번호를 발송함. */
async function sendIdEmailCode(user: User) {
  await user.type(screen.getByLabelText("이름"), "김빅링크");
  await chooseMethod(user, "이메일");
  await user.type(screen.getByLabelText("이메일"), "abc@naver.com");
  await user.click(screen.getByRole("button", { name: "인증번호 발송" }));
  await screen.findByLabelText("인증번호");
}

describe("FindPage", () => {
  beforeEach(() => {
    memberPost.mockReset();
    authPost.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("탭과 이동", () => {
    it("기본은 아이디 찾기이고 ?type=pw 면 비밀번호 찾기 탭이다", () => {
      renderPage();
      expect(screen.getByRole("tab", { name: "아이디" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    it("?type=pw 로 들어오면 비밀번호 탭이 선택된다", () => {
      renderPage("/find?type=pw");
      expect(screen.getByRole("tab", { name: "비밀번호" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    it("탭을 누르면 ?type= 만 남기고 replace 하며 입력 상태가 초기화된다", async () => {
      const { router, user } = renderPage("/find?service=client&type=id");
      await user.type(screen.getByLabelText("이름"), "김빅링크");

      await user.click(screen.getByRole("tab", { name: "비밀번호" }));
      expect(router.state.location.search).toBe("?type=pw");
      expect(router.state.historyAction).toBe("REPLACE");

      await user.click(screen.getByRole("tab", { name: "아이디" }));
      expect(screen.getByLabelText("이름")).toHaveValue("");
    });

    it("헤더 뒤로가기는 로그인으로 이동한다", async () => {
      const { router, user } = renderPage();
      await user.click(screen.getAllByRole("button", { name: "뒤로가기" })[0]!);
      await waitFor(() =>
        expect(router.state.location.pathname).toBe("/login"),
      );
    });
  });

  describe("아이디 찾기", () => {
    it("이름을 넣어야 인증수단을 고를 수 있다", async () => {
      const { user } = renderPage();
      expect(screen.getByRole("button", { name: "이메일" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "카카오톡" })).toBeDisabled();

      await user.type(screen.getByLabelText("이름"), "김빅링크");
      expect(screen.getByRole("button", { name: "이메일" })).toBeEnabled();
    });

    it("발송 버튼은 이름과 이메일이 모두 있어야 켜진다", async () => {
      const { user } = renderPage();
      await user.type(screen.getByLabelText("이름"), "김빅링크");
      await chooseMethod(user, "이메일");

      const send = screen.getByRole("button", { name: "인증번호 발송" });
      expect(send).toBeDisabled();
      await user.type(screen.getByLabelText("이메일"), "abc@naver.com");
      expect(send).toBeEnabled();
    });

    it("이메일 형식이 틀리면 서버를 부르지 않고 안내한다", async () => {
      const { user } = renderPage();
      await user.type(screen.getByLabelText("이름"), "김빅링크");
      await chooseMethod(user, "이메일");
      await user.type(screen.getByLabelText("이메일"), "not-an-email");
      await user.click(screen.getByRole("button", { name: "인증번호 발송" }));

      expect(
        await screen.findByText("잘못된 이메일 형식입니다"),
      ).toBeInTheDocument();
      expect(memberPost).not.toHaveBeenCalled();
    });

    it("이메일로 보내면 인증번호 입력과 60초 타이머가 나타난다", async () => {
      memberPost.mockResolvedValue({ result: "success" });
      const { user } = renderPage();
      await sendIdEmailCode(user);

      expect(memberPost).toHaveBeenCalledWith("/find/id/email", {
        name: "김빅링크",
        email: "abc@naver.com",
        serviceIdx: 1,
      });
      expect(
        screen.getByText("인증번호를 메일로 전송했습니다"),
      ).toBeInTheDocument();
      expect(screen.getByText(/^01\s?:\s?00$/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "인증하기" })).toBeDisabled();
    });

    it("재전송하면 남은 횟수를 n/3 형식으로 보여 준다", async () => {
      memberPost
        .mockResolvedValueOnce({ result: "success" })
        .mockResolvedValueOnce({ result: "success", count: 2 });
      const { user } = renderPage();
      await sendIdEmailCode(user);

      await user.click(
        screen.getByRole("button", { name: /인증번호 재전송 요청/ }),
      );
      expect(
        await screen.findByText(/\(남은 ?횟수 ?2\/3\)/),
      ).toBeInTheDocument();
    });

    it("재전송 대기 중이면 팝업을 띄우고 확인으로 닫는다", async () => {
      memberPost
        .mockResolvedValueOnce({ result: "success" })
        .mockRejectedValueOnce(
          new ApiError(400, { message: "request exists" }),
        );
      const { user } = renderPage();
      await sendIdEmailCode(user);

      await user.click(
        screen.getByRole("button", { name: /인증번호 재전송 요청/ }),
      );
      const popup = await screen.findByRole("alertdialog");
      expect(
        within(popup).getByText("인증번호 재전송", { exact: false }),
      ).toBeInTheDocument();
      expect(popup).toHaveTextContent("인증시간(1분)이 종료된 후");

      await user.click(within(popup).getByRole("button", { name: "확인" }));
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("인증번호가 틀리면 남은 횟수와 함께 안내한다", async () => {
      memberPost
        .mockResolvedValueOnce({ result: "success" })
        .mockRejectedValueOnce(
          new ApiError(400, { message: "authNum missmatch", count: 2 }),
        );
      const { user } = renderPage();
      await sendIdEmailCode(user);

      await user.type(screen.getByLabelText("인증번호"), "000000");
      await user.click(screen.getByRole("button", { name: "인증하기" }));

      expect(await screen.findByRole("status")).toHaveTextContent(
        "인증번호가 일치하지 않습니다. (남은 횟수 2/3)",
      );
      // 오류 문구는 인증번호 입력에 연결됨.
      expect(screen.getByLabelText("인증번호")).toHaveAccessibleDescription(
        /인증번호가 일치하지 않습니다/,
      );
      expect(screen.getByLabelText("인증번호")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });

    it("60초가 지나면 서버를 부르지 않고 입력시간 초과를 안내한다", async () => {
      memberPost.mockResolvedValue({ result: "success" });
      const { user } = renderPage();
      await sendIdEmailCode(user);
      memberPost.mockClear();

      const now = Date.now();
      vi.spyOn(Date, "now").mockReturnValue(now + 61_000);
      await user.type(screen.getByLabelText("인증번호"), "123456");
      await user.click(screen.getByRole("button", { name: "인증하기" }));

      expect(
        await screen.findByText("입력시간 초과되었습니다"),
      ).toBeInTheDocument();
      expect(memberPost).not.toHaveBeenCalled();
    });

    it("인증에 성공하면 아이디를 보여 주고 로그인·비밀번호 찾기로 이동한다", async () => {
      memberPost
        .mockResolvedValueOnce({ result: "success" })
        .mockResolvedValueOnce({ result: "success", id: "abcd_12" });
      const { router, user } = renderPage();
      await sendIdEmailCode(user);

      await user.type(screen.getByLabelText("인증번호"), "123456");
      await user.click(screen.getByRole("button", { name: "인증하기" }));

      expect(
        await screen.findByText("김빅링크 회원님의 아이디입니다."),
      ).toBeInTheDocument();
      expect(screen.getByText("아이디 : abcd_12")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "비밀번호 찾기" }));
      expect(router.state.location.search).toBe("?type=pw");
    });

    it("아이디 결과의 로그인 버튼은 로그인으로 이동한다", async () => {
      memberPost
        .mockResolvedValueOnce({ result: "success" })
        .mockResolvedValueOnce({ result: "success", id: "abcd_12" });
      const { router, user } = renderPage();
      await sendIdEmailCode(user);
      await user.type(screen.getByLabelText("인증번호"), "123456");
      await user.click(screen.getByRole("button", { name: "인증하기" }));
      await screen.findByText("아이디 : abcd_12");

      await user.click(screen.getByRole("button", { name: "로그인 하러가기" }));
      await waitFor(() =>
        expect(router.state.location.pathname).toBe("/login"),
      );
    });

    it("처음으로를 누르면 수단 선택으로 돌아가고 이름은 유지된다", async () => {
      memberPost.mockResolvedValue({ result: "success" });
      const { user } = renderPage();
      await sendIdEmailCode(user);

      await user.click(screen.getByRole("button", { name: "처음으로" }));
      expect(screen.getByLabelText("이름")).toHaveValue("김빅링크");
      expect(
        screen.getByRole("button", { name: "이메일" }),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText("인증번호")).not.toBeInTheDocument();
    });

    it("카카오톡은 휴대폰 번호로 보내고 안내 문구를 보여 준다", async () => {
      authPost.mockResolvedValue({
        success: true,
        data: { id: 42, remainVerificationCount: 2 },
      });
      const { user } = renderPage();
      await user.type(screen.getByLabelText("이름"), "김빅링크");
      await chooseMethod(user, "카카오톡");
      await user.type(screen.getByLabelText("휴대폰 번호"), "01012345678");
      await user.click(screen.getByRole("button", { name: "인증번호 발송" }));

      expect(
        await screen.findByText(/카카오톡으로 인증번호를 전송했습니다/),
      ).toBeInTheDocument();
      expect(screen.getByText(/\(남은 ?횟수 ?2\/3\)/)).toBeInTheDocument();
      expect(authPost).toHaveBeenCalledWith(
        "/lookup",
        expect.objectContaining({ loginId: null, phoneNumber: "01012345678" }),
      );
    });

    it("카카오톡 인증이 성공하면 아이디를 보여 준다", async () => {
      authPost
        .mockResolvedValueOnce({
          success: true,
          data: { id: 42, remainVerificationCount: 2 },
        })
        .mockResolvedValueOnce({ success: true, data: { loginId: "kakao_1" } });
      const { user } = renderPage();
      await user.type(screen.getByLabelText("이름"), "김빅링크");
      await chooseMethod(user, "카카오톡");
      await user.type(screen.getByLabelText("휴대폰 번호"), "01012345678");
      await user.click(screen.getByRole("button", { name: "인증번호 발송" }));
      await screen.findByLabelText("인증번호");

      await user.type(screen.getByLabelText("인증번호"), "123456");
      await user.click(screen.getByRole("button", { name: "인증하기" }));
      expect(await screen.findByText(/kakao_1/)).toBeInTheDocument();
    });
  });

  describe("비밀번호 찾기", () => {
    it("아이디와 이름이 있어야 인증수단을 고를 수 있다", async () => {
      const { user } = renderPage("/find?type=pw");
      expect(screen.getByRole("button", { name: "이메일" })).toBeDisabled();

      await user.type(
        screen.getByLabelText("가입 시 사용한 아이디"),
        "abcd_12",
      );
      expect(screen.getByRole("button", { name: "이메일" })).toBeDisabled();
      await user.type(screen.getByLabelText("이름"), "김빅링크");
      expect(screen.getByRole("button", { name: "이메일" })).toBeEnabled();
    });

    it("이메일로 보내면 재설정 링크 발송 화면으로 이동한다", async () => {
      memberPost.mockResolvedValue({ result: "success" });
      const { router, user } = renderPage("/find?type=pw");
      await user.type(
        screen.getByLabelText("가입 시 사용한 아이디"),
        "abcd_12",
      );
      await user.type(screen.getByLabelText("이름"), "김빅링크");
      await chooseMethod(user, "이메일");
      await user.type(screen.getByLabelText("이메일"), "abc@naver.com");
      await user.click(screen.getByRole("button", { name: "인증번호 발송" }));

      await waitFor(() =>
        expect(router.state.location.pathname).toBe("/find/email-sent"),
      );
      expect(memberPost).toHaveBeenCalledWith("/find/pw/email", {
        id: "abcd_12",
        name: "김빅링크",
        email: "abc@naver.com",
        serviceIdx: 1,
      });
    });

    it("카카오톡 인증이 끝나면 비밀번호 변경 버튼이 나오고 /changePw 로 간다", async () => {
      authPost
        .mockResolvedValueOnce({
          success: true,
          data: { id: 7, remainVerificationCount: 3 },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { resetPasswordCode: "rc" },
        });
      const { router, user } = renderPage("/find?type=pw");
      await user.type(
        screen.getByLabelText("가입 시 사용한 아이디"),
        "abcd_12",
      );
      await user.type(screen.getByLabelText("이름"), "김빅링크");
      await chooseMethod(user, "카카오톡");
      await user.type(screen.getByLabelText("휴대폰 번호"), "01012345678");
      await user.click(screen.getByRole("button", { name: "인증번호 발송" }));
      await screen.findByLabelText("인증번호");
      expect(authPost).toHaveBeenCalledWith(
        "/lookup",
        expect.objectContaining({ loginId: "abcd_12" }),
      );

      await user.type(screen.getByLabelText("인증번호"), "123456");
      await user.click(screen.getByRole("button", { name: "인증하기" }));
      await user.click(
        await screen.findByRole("button", { name: "비밀번호 변경" }),
      );
      await waitFor(() =>
        expect(router.state.location.pathname).toBe("/changePw"),
      );
    });
  });
});
