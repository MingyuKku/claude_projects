import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ApiError, serverApi, serverApiV3 } from "@/shared/api";
import { ROUTES } from "@/shared/config";

import {
  mockSession,
  mockSessionError,
  mockV3GetError,
  mockV3Get,
  renderRoute,
  resetSession,
} from "./test-utils";

import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApi: { get: vi.fn(), post: vi.fn() },
  serverApiV3: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
  // 실제 Firestore에 연결하면 테스트가 끝난 뒤 응답이 도착해 다른 파일 실행 중 에러가 남
  getFirestoreDb: () => new Promise(() => {}),
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
  resetSession(session);
  vi.mocked(serverApi.post)
    .mockReset()
    .mockResolvedValue({ result: true, authority: "MASTER", userIdx: 1 });
  // 문의 내역이 없는 계정(404)으로 둠.
  mockV3GetError(new ApiError(404, undefined));
});

// 하위 메뉴는 그룹이 열려 있어야 DOM에 있으므로, 닫혀 있으면 눌러 연다.
async function openNavGroup(
  user: ReturnType<typeof userEvent.setup>,
  scope: HTMLElement,
  name: string,
) {
  const trigger = within(scope).getByRole("button", { name });
  if (trigger.getAttribute("aria-expanded") === "false") {
    await user.click(trigger);
  }
}

describe("고객센터 진입", () => {
  it.each([
    { label: "빅버드 문의", isMobileMenu: false },
    { label: "구매자 문의", isMobileMenu: false },
    { label: "빅버드 문의", isMobileMenu: true },
    { label: "구매자 문의", isMobileMenu: true },
  ])(
    "비로그인 $label 클릭은 로그인으로 이동한다 (전체 메뉴: $isMobileMenu)",
    async ({ label, isMobileMenu }) => {
      mockSessionError(new ApiError(401, undefined));
      const user = userEvent.setup();
      const router = await renderRoute(ROUTES.main);
      await screen.findByRole("button", { name: "로그인" });
      if (isMobileMenu)
        await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
      const menu = isMobileMenu
        ? screen.getByRole("dialog", { name: "전체 메뉴" })
        : screen.getByRole("navigation", { name: "주 메뉴" });
      await openNavGroup(user, menu, "고객센터");
      const link = within(menu).getByRole("link", { name: label });
      expect(link).toHaveAttribute("href", ROUTES.login);
      await user.click(link);
      await screen.findByLabelText("아이디");
      expect(router.state.location.pathname).toBe(ROUTES.login);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(serverApiV3.get).not.toHaveBeenCalledWith("/sec", {
        headers: { "X-Path": ROUTES.customerCenterBigbird },
        signal: expect.any(AbortSignal),
      });
      expect(serverApiV3.get).not.toHaveBeenCalledWith("/sec", {
        headers: { "X-Path": ROUTES.customerCenterBuyer },
        signal: expect.any(AbortSignal),
      });
    },
  );

  // 로그인 흐름 자체는 e2e/login.spec.ts 가 검증하므로, 여기서는 로그인한 세션에서 시작해
  // 이동 한 번씩만 검증함(여러 화면을 한 테스트에서 오가면 느린 CI에서 테스트 제한 시간을 넘기기 쉬움).

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

    // 서버처럼 최신 생성순으로 목록(메시지 없음)을 주고, 상태 필터를 적용하며, 문의를 열면 대화 전문을 줌.
    function mockThreads(threads: ReturnType<typeof thread>[]) {
      mockV3Get((path, config) => {
        const params = (config as { params?: { status?: string } } | undefined)
          ?.params;
        if (path === "/help/bigbird-inquiry") {
          const status = params?.status ?? "ALL";
          const list = threads
            .filter((item) => status === "ALL" || item.status === status)
            .sort((a, b) => b.created.localeCompare(a.created))
            .map((item) => ({
              threadIdx: item.threadIdx,
              sequence: item.sequence,
              campaignIdx: item.campaignIdx,
              brandName: null,
              productName: null,
              status: item.status,
              created: item.created,
              finishTime: item.finishTime,
              boardType: item.boardType,
            }));
          return Promise.resolve({ result: true, list, hasMore: false });
        }
        const detail = /^\/help\/bigbird-inquiry\/(\d+)$/.exec(path);
        const found = threads.find(
          (item) => item.threadIdx === Number(detail?.[1]),
        );
        return found
          ? Promise.resolve({ result: true, data: found })
          : Promise.reject(new Error("unmocked"));
      });
    }

    beforeEach(() => {
      mockThreads([
        thread(1, "2026-10-01 10:00", "예전 문의"),
        thread(2, "2026-10-02 10:00", "최신 문의"),
      ]);
    });

    it("고객센터 화면에서는 LNB 고객센터 그룹이 펼쳐져 있다", async () => {
      await renderRoute(ROUTES.customerCenterBigbird);
      const [support] = await screen.findAllByRole("button", {
        name: "고객센터",
      });
      expect(support).toHaveAttribute("aria-expanded", "true");
    });

    it("문의를 고르지 않고 들어오면 최신 문의 대화를 보여 준다", async () => {
      await renderRoute(ROUTES.customerCenterBigbird);
      expect(
        await within(
          await screen.findByRole("region", { name: "문의 대화" }),
        ).findByText("최신 문의"),
      ).toBeInTheDocument();
      expect(
        within(screen.getByRole("region", { name: "문의 대화" })).queryByText(
          "예전 문의",
        ),
      ).not.toBeInTheDocument();
    });

    it("상태 탭을 고른 채 들어오면 그 탭의 최신 문의를 보여 준다", async () => {
      const answered = thread(1, "2026-10-01 10:00", "답변 받은 문의");
      answered.status = "ANSWERED";
      answered.messages.push({
        ...answered.messages[0]!,
        messageIdx: 11,
        body: "운영자 답변",
        isUserMessage: false,
      });
      mockThreads([answered, thread(2, "2026-10-02 10:00", "최신 문의")]);
      await renderRoute(`${ROUTES.customerCenterBigbird}?status=done`);
      expect(await screen.findByText("답변 받은 문의")).toBeInTheDocument();
      expect(screen.queryByText("최신 문의")).not.toBeInTheDocument();
      expect(
        screen.getByRole("region", { name: "문의 대화" }),
      ).toBeInTheDocument();
    });

    it("문의 주소로 직접 들어오면 그 대화를 보여 준다", async () => {
      await renderRoute("/customer-center/bigbird/1");
      expect(
        await within(
          await screen.findByRole("region", { name: "문의 대화" }),
        ).findByText("예전 문의"),
      ).toBeInTheDocument();
    });

    it("캠페인 카드가 아닌 자동 메시지는 보여 주지 않는다", async () => {
      const withAuto = thread(1, "2026-10-01 10:00", "본문");
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
      mockThreads([withAuto]);
      await renderRoute("/customer-center/bigbird/1");
      // 목록 카드의 "기타문의" 태그(Figma 26/10/29)와 섞이지 않게 대화 영역에서만 찾음.
      const conversation = await screen.findByRole("region", {
        name: "문의 대화",
      });
      expect(await within(conversation).findByText("본문")).toBeInTheDocument();
      expect(
        within(conversation).queryByText("기타문의"),
      ).not.toBeInTheDocument();
      expect(
        within(conversation).queryByText(/문의하실 내용을 남겨주세요/),
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

  it("구매자 문의 권한이 없는 SUB는 구매자 문의 링크가 비활성이고 빅버드 문의는 활성이다", async () => {
    mockSession({
      ...session,
      authority: "SUB",
      isPurchaserQuestionAccess: false,
    });
    await renderRoute(ROUTES.customerCenterBigbird);
    // 세션 확인이 끝나야 셸이 그려짐. (앞 테스트의 세션이 남아 있을 때만 바로 보이던 것에 기대지 않음)
    const nav = await screen.findByRole("navigation", { name: "주 메뉴" });
    await waitFor(() =>
      expect(
        within(nav).getByRole("link", { name: "구매자 문의" }),
      ).toHaveAttribute("aria-disabled", "true"),
    );
    expect(
      within(nav).getByRole("link", { name: "빅버드 문의" }),
    ).not.toHaveAttribute("aria-disabled");
  });

  it("권한 있는 SUB는 구매자 문의에 직접 진입할 수 있다", async () => {
    mockSession({
      ...session,
      authority: "SUB",
      isPurchaserQuestionAccess: true,
    });
    await renderRoute(ROUTES.customerCenterBuyer);
    expect(
      await screen.findByText("문의사항이 존재하지 않습니다."),
    ).toBeInTheDocument();
  });

  it("만료된 세션이면 로컬 로그인으로 돌아간다", async () => {
    mockSessionError(new ApiError(401, undefined));
    const router = await renderRoute(ROUTES.customerCenterBigbird);
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ROUTES.login),
    );
    expect(
      screen.queryByText("문의사항이 존재하지 않습니다."),
    ).not.toBeInTheDocument();
  });

  it("서버가 경로를 거절하면(result: false) 로그인이 아니라 홈으로 보낸다", async () => {
    vi.mocked(serverApiV3.get).mockImplementation(((
      path: string,
      options?: { headers?: Record<string, string> },
    ) =>
      path === "/sec"
        ? Promise.resolve({
            ...session,
            result: options?.headers?.["X-Path"] === ROUTES.main,
          })
        : Promise.reject(new ApiError(404, undefined))) as never);
    const router = await renderRoute(ROUTES.customerCenterBigbird);
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ROUTES.main),
    );
    expect(
      screen.queryByText("문의사항이 존재하지 않습니다."),
    ).not.toBeInTheDocument();
  });

  it("세션 확인이 서버 오류로 실패하면 로그인으로 보내지 않고 에러 화면을 보여 준다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockSessionError(new ApiError(500, undefined));
    const router = await renderRoute(ROUTES.customerCenterBigbird);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "문제가 발생했습니다",
    );
    expect(router.state.location.pathname).toBe(ROUTES.customerCenterBigbird);
  });
});
