import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ApiError, serverApi, serverApiV3 } from "@/shared/api";
import { ROUTES } from "@/shared/config";

import {
  mockSession,
  mockSessionError,
  mockSessionErrorOnce,
  mockV3GetError,
  mockV3Get,
  renderRoute,
  resetSession,
} from "./test-utils";

import type * as SharedApi from "@/shared/api";

// 이 파일은 펼친 PC LNB에서 셸 동작을 검증함. LNB 기본은 접힘이고(sidebar-store), 저장된 상태는 스토어를 불러올 때
// localStorage에서 복원되므로 모듈을 불러오기 전에 "펼쳐 둔 사용자" 상태를 저장해 둠.
vi.hoisted(() => {
  localStorage.setItem(
    "bigbird:sidebar",
    JSON.stringify({ state: { isCollapsed: false }, version: 0 }),
  );
});

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

  // 로그인 흐름 자체는 main-navigation의 "로그인 성공 후 …" 테스트가 검증하므로, 여기서는 로그인한 세션에서 시작해
  // 이동 한 번씩만 검증함(여러 화면을 한 테스트에서 오가면 느린 CI에서 테스트 제한 시간을 넘기기 쉬움).
  // 도착 화면은 본문 문구(데이터 상태에 따라 바뀜) 대신 화면의 정체로 확인함: 문서 제목(화면 컴포넌트가 그려야 바뀜), 경로, LNB 현재 위치.
  async function expectCustomerCenterPage(
    router: Awaited<ReturnType<typeof renderRoute>>,
    { path, title }: { path: string; title: string },
  ) {
    await waitFor(() => expect(document.title).toBe(title));
    expect(router.state.location.pathname).toBe(path);
    expect(
      within(screen.getByRole("navigation", { name: "주 메뉴" })).getByRole(
        "link",
        { name: title },
      ),
    ).toHaveAttribute("aria-current", "page");
  }

  const BIGBIRD_PAGE = {
    path: ROUTES.customerCenterBigbird,
    title: "빅버드 문의",
  };
  const BUYER_PAGE = { path: ROUTES.customerCenterBuyer, title: "구매자 문의" };

  it("로그인 후 LNB 빅버드 문의를 누르면 그 경로의 세션을 확인하고 빅버드 문의 화면으로 이동한다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute(ROUTES.main);
    const nav = await screen.findByRole("navigation", { name: "주 메뉴" });
    await user.click(within(nav).getByRole("link", { name: "빅버드 문의" }));
    await expectCustomerCenterPage(router, BIGBIRD_PAGE);
    expect(serverApiV3.get).toHaveBeenCalledWith("/sec", {
      headers: { "X-Path": ROUTES.customerCenterBigbird },
      signal: expect.any(AbortSignal),
    });
    // 세션은 `GET /v3/sec`로만 확인하고 V2 `GET /sec`는 부르지 않음.
    expect(serverApi.get).not.toHaveBeenCalled();
  });

  it("빅버드 문의에서 LNB 구매자 문의를 누르면 구매자 문의 화면으로 이동한다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute(ROUTES.customerCenterBigbird);
    await expectCustomerCenterPage(router, BIGBIRD_PAGE);
    await user.click(
      within(screen.getByRole("navigation", { name: "주 메뉴" })).getByRole(
        "link",
        { name: "구매자 문의" },
      ),
    );
    await expectCustomerCenterPage(router, BUYER_PAGE);
  });

  it("구매자 문의에서 뒤로 가면 빅버드 문의 화면과 선택 메뉴가 복원된다", async () => {
    const router = await renderRoute([
      ROUTES.customerCenterBigbird,
      ROUTES.customerCenterBuyer,
    ]);
    await expectCustomerCenterPage(router, BUYER_PAGE);
    await act(async () => {
      await router.navigate(-1);
    });
    await expectCustomerCenterPage(router, BIGBIRD_PAGE);
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
      const [support] = await screen.findAllByText("고객센터", {
        selector: "summary span",
      });
      expect(support?.closest("details")).toHaveAttribute("open");
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

  it("구매자 문의 권한이 없는 SUB가 직접 진입하면 서버가 403으로 막아 홈으로 보낸다", async () => {
    mockSessionErrorOnce(
      new ApiError(403, { result: false, reason: "forbidden" }),
    );
    const router = await renderRoute(ROUTES.customerCenterBuyer);
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(ROUTES.main),
    );
    expect(
      screen.queryByText("구매자 문의 화면을 준비 중입니다."),
    ).not.toBeInTheDocument();
  });

  it("권한 있는 SUB는 구매자 문의에 직접 진입할 수 있다", async () => {
    mockSession({
      ...session,
      authority: "SUB",
      isPurchaserQuestionAccess: true,
    });
    await renderRoute(ROUTES.customerCenterBuyer);
    expect(
      await screen.findByText("구매자 문의 화면을 준비 중입니다."),
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
