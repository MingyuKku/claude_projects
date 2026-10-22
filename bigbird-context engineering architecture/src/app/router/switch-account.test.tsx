import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ApiError, serverApi } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { hardNavigate } from "@/shared/lib";

import { renderRoute } from "./test-utils";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  serverApi: { get: vi.fn(), post: vi.fn() },
}));

vi.mock("@/shared/lib", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  hardNavigate: vi.fn(),
}));

const adminSession = {
  result: true,
  userIdx: 1,
  accountIdx: 2,
  threadUserIdx: 3,
  authority: "ADMIN",
  service: "client",
  identifier: "tester",
  email: "test@example.com",
};
const accounts = {
  clientList: [
    { id: "sample-master", user_idx: 42, company_name: null },
    { id: "bigbird", user_idx: 1, company_name: "빅버드" },
  ],
};

beforeEach(() => {
  vi.mocked(hardNavigate).mockClear();
  vi.mocked(serverApi.get)
    .mockReset()
    .mockImplementation(async (path) =>
      path === "/super" ? accounts : adminSession,
    );
  vi.mocked(serverApi.post).mockReset().mockResolvedValue({ result: true });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("관리자 계정 전환", () => {
  it("ADMIN은 빅버드 로고로 진입하고 bigbird 계정을 먼저 표시한다", async () => {
    const user = userEvent.setup();
    const router = await renderRoute(ROUTES.main);
    await user.click(
      await screen.findByRole("link", { name: "빅버드 · 아이디 변경" }),
    );
    const list = await screen.findByRole("list", { name: "전환할 계정" });
    expect(router.state.location.pathname).toBe(ROUTES.switchAccount);
    expect(within(list).getAllByRole("listitem")[0]).toHaveTextContent(
      "bigbird",
    );
    expect(serverApi.get).toHaveBeenCalledWith("/sec", {
      headers: { "X-Path": ROUTES.switchAccount },
    });
    expect(
      screen.getByRole("heading", { name: "아이디 변경" }),
    ).toBeInTheDocument();
  });

  it.each(["MASTER", "SUB"])(
    "%s는 계정 전환 목록을 요청하지 않고 홈으로 돌아간다",
    async (authority) => {
      vi.mocked(serverApi.get).mockResolvedValue({
        ...adminSession,
        authority,
      });
      const router = await renderRoute(ROUTES.switchAccount);
      await screen.findByRole("heading", { name: "홈" });
      expect(router.state.location.pathname).toBe(ROUTES.main);
      expect(serverApi.get).not.toHaveBeenCalledWith("/super");
      expect(
        screen.queryByRole("link", { name: "빅버드 · 아이디 변경" }),
      ).not.toBeInTheDocument();
    },
  );

  it("미인증 접근은 로컬 로그인으로 이동한다", async () => {
    vi.mocked(serverApi.get).mockRejectedValue(new ApiError(401, undefined));
    const router = await renderRoute(ROUTES.switchAccount);
    await screen.findByLabelText("아이디");
    expect(router.state.location.pathname).toBe(ROUTES.login);
    expect(serverApi.get).not.toHaveBeenCalledWith("/super");
  });

  it("전환 중 다른 클릭을 막고 성공하면 로컬 홈을 재로드한다", async () => {
    const user = userEvent.setup();
    let finish: ((value: unknown) => void) | undefined;
    vi.mocked(serverApi.post).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    await renderRoute(ROUTES.switchAccount);
    await user.click(
      await screen.findByRole("button", {
        name: "sample-master 계정으로 변경",
      }),
    );
    expect(serverApi.post).toHaveBeenCalledWith("/super/change", {
      userIdx: 42,
    });
    expect(
      screen.getByRole("button", { name: "bigbird 계정으로 변경" }),
    ).toBeDisabled();
    expect(hardNavigate).not.toHaveBeenCalled();
    finish?.({ result: true });
    await waitFor(() => expect(hardNavigate).toHaveBeenCalledWith("/"));
  });

  it.each([{ result: false }, { unexpected: true }])(
    "전환 실패·잘못된 응답이면 이동하지 않고 재시도한다 (%j)",
    async (response) => {
      const user = userEvent.setup();
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(serverApi.post).mockResolvedValue(response);
      await renderRoute(ROUTES.switchAccount);
      await user.click(
        await screen.findByRole("button", {
          name: "sample-master 계정으로 변경",
        }),
      );
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "계정을 변경하지 못했습니다.",
      );
      expect(hardNavigate).not.toHaveBeenCalled();
      expect(
        screen.getByRole("button", { name: "sample-master 계정으로 변경" }),
      ).toBeEnabled();
    },
  );

  it("목록 조회 실패 후 다시 시도할 수 있다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let hasFailed = false;
    vi.mocked(serverApi.get).mockImplementation(async (path) => {
      if (path !== "/super") return adminSession;
      if (!hasFailed) {
        hasFailed = true;
        throw new ApiError(500, undefined);
      }
      return accounts;
    });
    const user = userEvent.setup();
    await renderRoute(ROUTES.switchAccount);
    await user.click(await screen.findByRole("button", { name: "다시 시도" }));
    expect(
      await screen.findByRole("button", {
        name: "sample-master 계정으로 변경",
      }),
    ).toBeInTheDocument();
  });
});
