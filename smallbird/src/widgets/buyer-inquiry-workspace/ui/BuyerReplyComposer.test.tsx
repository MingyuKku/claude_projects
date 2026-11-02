import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";

import { useInquiryUploadStore } from "@/entities/inquiry";
import { serverApiV3 } from "@/shared/api";

import { BuyerReplyComposer } from "./BuyerReplyComposer";

import type { BuyerInquiryViewModel } from "@/entities/inquiry";

const flags = vi.hoisted(() => ({ isWriteEnabled: true }));
vi.mock("../model/constants", () => ({
  get IS_BUYER_WRITE_ENABLED() {
    return flags.isWriteEnabled;
  },
}));
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    serverApiV3: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

const inquiry: BuyerInquiryViewModel = {
  key: "purchaser-501",
  inquiryIdx: 501,
  source: "purchaser",
  status: "waiting",
  campaignIdx: 10,
  orderNumber: null,
  writerName: "김하루",
  body: "문의",
  writeTime: new Date("2026-10-01T10:00"),
  threadUserIdx: 77,
  userIdx: null,
  preview: "문의",
  lastActivityAt: new Date("2026-10-01T10:00"),
};

const thread = (threadIdx: number, created: string) => ({
  threadIdx,
  sequence: 1,
  viewing: null,
  toUserIdx: 1,
  fmUserIdx: 77,
  campaignIdx: 10,
  finishTime: null,
  created,
  boardType: true,
  status: "WAITING",
  messages: [],
});

function mockThreads(data: ReturnType<typeof thread>[]) {
  vi.mocked(serverApiV3.get).mockResolvedValue({ result: true, data });
}

function renderComposer() {
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <BuyerReplyComposer inquiry={inquiry} />
    </SWRConfig>,
  );
}

beforeEach(() => {
  flags.isWriteEnabled = true;
  vi.clearAllMocks();
  useInquiryUploadStore.setState({ jobs: {} });
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

describe("구매자 문의 답장 입력창", () => {
  it("가장 최근 스레드에 텍스트를 보낸다", async () => {
    const user = userEvent.setup();
    mockThreads([
      thread(1, "2026-10-01T09:00:00"),
      thread(2, "2026-10-02T09:00:00"),
    ]);
    vi.mocked(serverApiV3.post).mockResolvedValue({
      result: true,
      threadIdx: 2,
    });
    renderComposer();
    await waitFor(() => expect(screen.getByRole("textbox")).toBeEnabled());
    await user.type(screen.getByRole("textbox"), "내일 출발합니다.");
    await user.click(screen.getByRole("button", { name: "전송" }));
    await waitFor(() =>
      expect(serverApiV3.post).toHaveBeenCalledWith("/help/thread/message", {
        threadIdx: 2,
        body: "내일 출발합니다.",
        attachmentIdx: null,
        isAuto: false,
      }),
    );
    await waitFor(() => expect(screen.getByRole("textbox")).toHaveValue(""));
  });

  it("종료된 스레드라 서버가 새 스레드를 만들면 첨부를 그 스레드로 보낸다", async () => {
    const user = userEvent.setup();
    mockThreads([thread(2, "2026-10-02T09:00:00")]);
    vi.mocked(serverApiV3.post).mockImplementation(async (path: string) =>
      path === "/help/thread/message"
        ? { result: true, threadIdx: 3 }
        : {
            result: true,
            url: "u",
            attachmentIdx: 1,
            fileName: "a.png",
            fileSize: 1,
          },
    );
    renderComposer();
    await waitFor(() => expect(screen.getByRole("textbox")).toBeEnabled());
    await user.type(screen.getByRole("textbox"), "첨부 드립니다");
    await user.upload(
      document.querySelector<HTMLInputElement>("input[type=file]")!,
      new File(["x"], "a.png"),
    );
    await user.click(screen.getByRole("button", { name: "전송" }));
    await waitFor(() =>
      expect(
        vi
          .mocked(serverApiV3.post)
          .mock.calls.some(
            ([path, body]) =>
              path === "/help/thread/message" &&
              (body as { threadIdx: number; attachmentIdx: number | null })
                .threadIdx === 3 &&
              (body as { attachmentIdx: number | null }).attachmentIdx === 1,
          ),
      ).toBe(true),
    );
  });

  it("대화 내역(스레드)이 없으면 보낼 곳이 없어 입력이 막힌다", async () => {
    mockThreads([]);
    renderComposer();
    await waitFor(() => expect(screen.getByRole("textbox")).toBeDisabled());
    expect(screen.getByRole("button", { name: "전송" })).toBeDisabled();
  });

  it("전송이 실패하면 입력을 지우지 않고 안내한다", async () => {
    const user = userEvent.setup();
    mockThreads([thread(2, "2026-10-02T09:00:00")]);
    vi.mocked(serverApiV3.post).mockRejectedValue(new Error("500"));
    renderComposer();
    await waitFor(() => expect(screen.getByRole("textbox")).toBeEnabled());
    await user.type(screen.getByRole("textbox"), "실패할 글");
    await user.click(screen.getByRole("button", { name: "전송" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "처리하지 못했습니다. 다시 시도해 주세요.",
      ),
    );
    expect(screen.getByRole("textbox")).toHaveValue("실패할 글");
  });

  it("쓰기를 꺼 두면 입력창은 보이지만 비활성이라 보낼 수 없다", async () => {
    flags.isWriteEnabled = false;
    mockThreads([thread(1, "2026-10-01T09:00:00")]);
    renderComposer();
    // 대화(스레드)를 받은 뒤에도 입력은 막혀 있어야 함.
    await waitFor(() => expect(serverApiV3.get).toHaveBeenCalled());
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "전송" })).toBeDisabled();
    expect(serverApiV3.post).not.toHaveBeenCalled();
  });
});
