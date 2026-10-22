import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ApiError, serverApi, serverApiV3 } from "@/shared/api";
import { ROUTES } from "@/shared/config";

import { renderRoute } from "./test-utils";

import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApi: { get: vi.fn(), post: vi.fn() },
  serverApiV3: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

const session = {
  result: true,
  userIdx: 1,
  accountIdx: 2,
  threadUserIdx: 3,
  authority: "MASTER",
  service: "client",
  nickname: "테스트",
  identifier: "tester",
  email: "test@example.com",
};

beforeEach(() => {
  vi.mocked(serverApi.get).mockReset().mockResolvedValue(session);
  vi.mocked(serverApi.post)
    .mockReset()
    .mockResolvedValue({ result: true, authority: "MASTER", userIdx: 1 });
  // 문의 내역이 없는 계정(404)으로 둠.
  vi.mocked(serverApiV3.get)
    .mockReset()
    .mockRejectedValue(new ApiError(404, undefined));
});

describe("고객센터 진입", () => {
  it.each([
    { label: "빅버드 문의", isMobileMenu: false },
    { label: "구매자 문의", isMobileMenu: false },
    { label: "빅버드 문의", isMobileMenu: true },
    { label: "구매자 문의", isMobileMenu: true },
  ])(
    "비로그인 $label 클릭은 로그인으로 이동한다 (전체 메뉴: $isMobileMenu)",
    async ({ label, isMobileMenu }) => {
      vi.mocked(serverApi.get).mockRejectedValue(new ApiError(401, undefined));
      const user = userEvent.setup();
      const router = await renderRoute(ROUTES.main);
      await screen.findByRole("button", { name: "로그인" });
      if (isMobileMenu)
        await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
      const menu = isMobileMenu
        ? screen.getByRole("dialog", { name: "전체 메뉴" })
        : screen.getByRole("navigation", { name: "주 메뉴" });
      const link = within(menu).getByRole("link", { name: label });
      expect(link).toHaveAttribute("href", ROUTES.login);
      await user.click(link);
      await screen.findByLabelText("아이디");
      expect(router.state.location.pathname).toBe(ROUTES.login);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(serverApi.get).not.toHaveBeenCalledWith("/sec", {
        headers: { "X-Path": ROUTES.customerCenterBigbird },
      });
      expect(serverApi.get).not.toHaveBeenCalledWith("/sec", {
        headers: { "X-Path": ROUTES.customerCenterBuyer },
      });
    },
  );

  it("로그인 후 LNB로 두 문의 화면을 오가고 뒤로 가면 선택 메뉴가 복원된다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute(ROUTES.login);
    await user.type(await screen.findByLabelText("아이디"), "tester");
    await user.type(screen.getByLabelText("비밀번호"), "test-password");
    await user.click(screen.getByRole("button", { name: "로그인" }));
    const nav = await screen.findByRole("navigation", { name: "주 메뉴" });
    await user.click(within(nav).getByRole("link", { name: "빅버드 문의" }));
    expect(
      await screen.findByText("문의사항이 존재하지 않습니다."),
    ).toBeInTheDocument();
    expect(serverApi.get).toHaveBeenCalledWith("/sec", {
      headers: { "X-Path": ROUTES.customerCenterBigbird },
    });
    await user.click(
      within(screen.getByRole("navigation", { name: "주 메뉴" })).getByRole(
        "link",
        { name: "구매자 문의" },
      ),
    );
    expect(
      await screen.findByText("구매자 문의 화면을 준비 중입니다."),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(ROUTES.customerCenterBuyer);
    await act(async () => {
      await router.navigate(-1);
    });
    expect(
      await screen.findByText("문의사항이 존재하지 않습니다."),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation", { name: "주 메뉴" })).getByRole(
        "link",
        { name: "빅버드 문의" },
      ),
    ).toHaveAttribute("aria-current", "page");
    expect(
      vi.mocked(serverApi.get).mock.calls.every(([path]) => path === "/sec"),
    ).toBe(true);
  });

  describe("빅버드 문의 대화", () => {
    function thread(threadIdx: number, created: string, body: string) {
      return {
        threadIdx,
        sequence: threadIdx,
        viewing: null,
        toUserIdx: 1,
        fmUserIdx: 3,
        campaignIdx: null,
        finishTime: null,
        created,
        boardType: true,
        status: "WAITING" as "WAITING" | "IN_PROGRESS" | "ANSWERED",
        messages: [
          {
            messageIdx: threadIdx * 10,
            threadIdx,
            body,
            userIdx: 3,
            attachmentIdx: null,
            writeTime: created,
            readTime: null,
            modifyTime: null,
            deleteTime: null,
            identifier: "tester",
            isUserMessage: true,
            fileName: null,
            fileSize: null,
            fileType: null,
            auto: false,
          },
        ],
      };
    }

    beforeEach(() => {
      vi.mocked(serverApiV3.get).mockResolvedValue({
        result: true,
        data: [
          thread(1, "2026-10-01T10:00:00", "예전 문의"),
          thread(2, "2026-10-02T10:00:00", "최신 문의"),
        ],
      });
    });

    it("문의를 고르지 않고 들어오면 최신 문의 대화를 보여 준다", async () => {
      await renderRoute(ROUTES.customerCenterBigbird);
      expect(await screen.findByText("최신 문의")).toBeInTheDocument();
      expect(screen.queryByText("예전 문의")).not.toBeInTheDocument();
    });

    it("상태 탭을 고른 채 들어오면 그 탭의 최신 문의를 보여 준다", async () => {
      const answered = thread(1, "2026-10-01T10:00:00", "답변 받은 문의");
      answered.status = "ANSWERED";
      answered.messages.push({
        ...answered.messages[0]!,
        messageIdx: 11,
        body: "운영자 답변",
        isUserMessage: false,
      });
      vi.mocked(serverApiV3.get).mockResolvedValue({
        result: true,
        data: [answered, thread(2, "2026-10-02T10:00:00", "최신 문의")],
      });
      await renderRoute(`${ROUTES.customerCenterBigbird}?status=done`);
      expect(await screen.findByText("답변 받은 문의")).toBeInTheDocument();
      expect(screen.queryByText("최신 문의")).not.toBeInTheDocument();
      expect(
        screen.getByRole("region", { name: "문의 대화" }),
      ).toBeInTheDocument();
    });

    it("문의 주소로 직접 들어오면 그 대화를 보여 준다", async () => {
      await renderRoute("/customer-center/bigbird/1");
      expect(await screen.findByText("예전 문의")).toBeInTheDocument();
    });

    it("캠페인 카드가 아닌 자동 메시지는 보여 주지 않는다", async () => {
      const withAuto = thread(1, "2026-10-01T10:00:00", "본문");
      withAuto.messages.unshift(
        {
          ...withAuto.messages[0]!,
          messageIdx: 1,
          body: "기타문의",
          auto: true,
        },
        {
          ...withAuto.messages[0]!,
          messageIdx: 2,
          body: "안녕하세요 :D </br>문의하실 내용을 남겨주세요.",
          auto: true,
        },
      );
      vi.mocked(serverApiV3.get).mockResolvedValue({
        result: true,
        data: [withAuto],
      });
      await renderRoute("/customer-center/bigbird/1");
      expect(await screen.findByText("본문")).toBeInTheDocument();
      expect(screen.queryByText("기타문의")).not.toBeInTheDocument();
      expect(
        screen.queryByText(/문의하실 내용을 남겨주세요/),
      ).not.toBeInTheDocument();
    });

    it("목록에 없는 문의면 목록으로 돌아가는 안내를 보여 준다", async () => {
      await renderRoute("/customer-center/bigbird/999");
      expect(
        await screen.findByText("문의를 찾을 수 없습니다."),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "문의 목록으로" }),
      ).toHaveAttribute("href", ROUTES.customerCenterBigbird);
    });
  });

  it("전체 메뉴에서 이동하면 메뉴가 닫힌다", async () => {
    const user = userEvent.setup();
    await renderRoute(ROUTES.main);
    await user.click(await screen.findByRole("button", { name: "메뉴 열기" }));
    const dialog = screen.getByRole("dialog", { name: "전체 메뉴" });
    await user.click(within(dialog).getByRole("link", { name: "구매자 문의" }));
    expect(
      await screen.findByText("구매자 문의 화면을 준비 중입니다."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("권한 없는 SUB는 직접 진입을 막고 LNB 링크를 비활성화한다", async () => {
    vi.mocked(serverApi.get).mockResolvedValue({
      ...session,
      authority: "SUB",
      isCustomerServiceAccess: false,
    });
    const router = await renderRoute(ROUTES.customerCenterBuyer);
    // 확인 중에는 앞 화면의 세션으로 셸이 먼저 그려지므로, 홈으로 이동한 뒤의 메뉴를 봄.
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ROUTES.main),
    );
    await waitFor(() =>
      expect(
        within(screen.getByRole("navigation", { name: "주 메뉴" })).getByRole(
          "link",
          { name: "빅버드 문의" },
        ),
      ).toHaveAttribute("aria-disabled", "true"),
    );
    expect(
      screen.queryByText("구매자 문의 화면을 준비 중입니다."),
    ).not.toBeInTheDocument();
  });

  it("권한 있는 SUB는 구매자 문의에 직접 진입할 수 있다", async () => {
    vi.mocked(serverApi.get).mockResolvedValue({
      ...session,
      authority: "SUB",
      isCustomerServiceAccess: true,
    });
    await renderRoute(ROUTES.customerCenterBuyer);
    expect(
      await screen.findByText("구매자 문의 화면을 준비 중입니다."),
    ).toBeInTheDocument();
  });

  it.each(["만료된 세션", "서버 접근 거절"])(
    "%s이면 로컬 로그인으로 돌아간다",
    async (reason) => {
      if (reason === "만료된 세션")
        vi.mocked(serverApi.get).mockRejectedValue(new Error("Unauthorized"));
      else
        vi.mocked(serverApi.get).mockResolvedValue({
          ...session,
          result: false,
        });
      const router = await renderRoute(ROUTES.customerCenterBigbird);
      await waitFor(() =>
        expect(router.state.location.pathname).toBe(ROUTES.login),
      );
      expect(
        screen.queryByText("문의사항이 존재하지 않습니다."),
      ).not.toBeInTheDocument();
    },
  );
});
