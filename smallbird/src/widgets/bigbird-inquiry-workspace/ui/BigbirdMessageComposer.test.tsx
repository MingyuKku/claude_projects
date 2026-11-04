import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { SWRConfig } from "swr";

import { useInquiryUploadStore } from "@/entities/inquiry";
import { serverApiV3 } from "@/shared/api";

import { BigbirdMessageComposer } from "./BigbirdMessageComposer";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, serverApiV3: { get: vi.fn(), post: vi.fn() } };
});

function renderComposer(
  onSent = vi.fn(),
  props: { isFinished?: boolean; campaignIdx?: number | null } = {},
) {
  const router = createMemoryRouter(
    [
      {
        path: "/customer-center/bigbird/:threadIdx",
        element: (
          <BigbirdMessageComposer threadIdx={101} onSent={onSent} {...props} />
        ),
      },
    ],
    { initialEntries: ["/customer-center/bigbird/101"] },
  );
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <RouterProvider router={router} />
    </SWRConfig>,
  );
  return { router, onSent };
}

beforeEach(() => {
  vi.clearAllMocks();
  useInquiryUploadStore.setState({ jobs: {} });
});

describe("일반 문의 입력창", () => {
  it("열린 문의에 텍스트를 보내고 입력을 비운 뒤 다시 받는다", async () => {
    const user = userEvent.setup();
    vi.mocked(serverApiV3.post).mockResolvedValue({
      result: true,
      threadIdx: 101,
    });
    const { router, onSent } = renderComposer();
    await user.type(screen.getByRole("textbox"), "추가 문의입니다{Enter}");
    await waitFor(() => expect(onSent).toHaveBeenCalledOnce());
    expect(serverApiV3.post).toHaveBeenCalledWith(
      "/help/thread/message",
      {
        threadIdx: 101,
        body: "추가 문의입니다",
        attachmentIdx: null,
        isAuto: false,
      },
      { headers: { "X-Device-Id": expect.any(String) } },
    );
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(router.state.location.pathname).toBe("/customer-center/bigbird/101");
  });

  it("전송 중에 이어서 쓴 글은 전송이 끝나도 지우지 않는다", async () => {
    const user = userEvent.setup();
    let resolve: (value: unknown) => void = () => {};
    vi.mocked(serverApiV3.post).mockReturnValue(
      new Promise((done) => (resolve = done)),
    );
    const { onSent } = renderComposer();
    const textbox = screen.getByRole("textbox");
    await user.type(textbox, "첫 문의{Enter}");
    await user.clear(textbox);
    await user.type(textbox, "다음 글");
    resolve({ result: true, threadIdx: 101 });
    await waitFor(() => expect(onSent).toHaveBeenCalledOnce());
    expect(textbox).toHaveValue("다음 글");
  });

  it("그사이 종료돼 서버가 새 스레드를 만들면 그 문의로 이동한다", async () => {
    const user = userEvent.setup();
    vi.mocked(serverApiV3.post).mockResolvedValue({
      result: true,
      threadIdx: 202,
    });
    const { router } = renderComposer();
    await user.type(screen.getByRole("textbox"), "다시 문의{Enter}");
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        "/customer-center/bigbird/202",
      ),
    );
    // 목록이 새 문의를 받아오기 전에 '찾을 수 없는 문의'가 보이지 않게 함
    expect(router.state.location.state).toEqual({ pendingThreadIdx: 202 });
  });

  it("끝난 문의에 보내면 일반 문의 스레드를 먼저 만들고 그 스레드로 보낸다", async () => {
    const user = userEvent.setup();
    vi.mocked(serverApiV3.post)
      .mockResolvedValueOnce({
        result: true,
        data: { sequence: 9, threadIdx: 303 },
      })
      .mockResolvedValueOnce({ result: true, threadIdx: 303 });
    const { router } = renderComposer(vi.fn(), {
      isFinished: true,
      campaignIdx: 10,
    });
    await user.type(screen.getByRole("textbox"), "다시 문의{Enter}");
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        "/customer-center/bigbird/303",
      ),
    );
    expect(serverApiV3.post).toHaveBeenNthCalledWith(1, "/help/thread", {
      isBoardType: true,
      campaignIdx: 10,
    });
    expect(serverApiV3.post).toHaveBeenNthCalledWith(
      2,
      "/help/thread/message",
      expect.objectContaining({ threadIdx: 303, body: "다시 문의" }),
      { headers: { "X-Device-Id": expect.any(String) } },
    );
  });

  it("전송에 실패하면 알리고 입력을 남긴다", async () => {
    const user = userEvent.setup();
    vi.mocked(serverApiV3.post).mockRejectedValue(new Error("500"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { onSent } = renderComposer();
    await user.type(screen.getByRole("textbox"), "실패할 글{Enter}");
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "처리하지 못했습니다. 다시 시도해 주세요.",
      ),
    );
    expect(screen.getByRole("textbox")).toHaveValue("실패할 글");
    expect(onSent).not.toHaveBeenCalled();
  });
});
