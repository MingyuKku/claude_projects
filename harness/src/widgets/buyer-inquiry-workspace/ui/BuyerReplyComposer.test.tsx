import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  sequence: null,
  preview: "문의",
  lastActivityAt: new Date("2026-10-01T10:00"),
  hasUnread: false,
  brandName: null,
  campaignName: null,
  shopName: null,
  influencerNickname: null,
};

function mockTimeline() {
  vi.mocked(serverApiV3.get).mockResolvedValue({ result: true, data: [] });
}

function renderComposer(value: BuyerInquiryViewModel = inquiry) {
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <BuyerReplyComposer inquiry={value} />
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
  it("목록 행의 문의 번호로 텍스트를 보낸다", async () => {
    const user = userEvent.setup();
    mockTimeline();
    vi.mocked(serverApiV3.post).mockResolvedValue({
      result: true,
      threadIdx: 501,
    });
    renderComposer();
    await waitFor(() => expect(screen.getByRole("textbox")).toBeEnabled());
    await user.type(screen.getByRole("textbox"), "내일 출발합니다.");
    await user.click(screen.getByRole("button", { name: "전송" }));
    await waitFor(() =>
      expect(serverApiV3.post).toHaveBeenCalledWith(
        "/help/thread/message",
        {
          threadIdx: 501,
          body: "내일 출발합니다.",
          attachmentIdx: null,
          isAuto: false,
        },
        { headers: { "X-Device-Id": expect.any(String) } },
      ),
    );
    await waitFor(() => expect(screen.getByRole("textbox")).toHaveValue(""));
  });

  it("종료된 스레드라 서버가 새 스레드를 만들면 첨부를 그 스레드로 보낸다", async () => {
    const user = userEvent.setup();
    mockTimeline();
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

  it("텍스트를 보내는 동안 새로 고른 파일은 지우지 않고 보낸 파일만 지운다", async () => {
    const user = userEvent.setup();
    mockTimeline();
    let finishText: (value: unknown) => void = () => {};
    let isTextPending = true;
    vi.mocked(serverApiV3.post).mockImplementation((path: string) => {
      if (path !== "/help/thread/message") {
        return Promise.resolve({
          result: true,
          url: "u",
          attachmentIdx: 1,
          fileName: "a.png",
          fileSize: 1,
        });
      }
      // 첫 메시지(텍스트)만 보류하고, 첨부를 알리는 이후 호출은 바로 끝내 업로드 작업이 남지 않게 함
      if (!isTextPending) {
        return Promise.resolve({ result: true, threadIdx: 501 });
      }
      isTextPending = false;
      return new Promise((resolve) => (finishText = resolve));
    });
    renderComposer();
    await waitFor(() => expect(screen.getByRole("textbox")).toBeEnabled());
    const input = () =>
      document.querySelector<HTMLInputElement>("input[type=file]")!;
    await user.type(screen.getByRole("textbox"), "첨부 드립니다");
    await user.upload(input(), new File(["x"], "a.png", { type: "image/png" }));
    await user.click(screen.getByRole("button", { name: "전송" }));
    // 텍스트 전송이 끝나기 전에 다음 파일을 고름
    await user.upload(input(), new File(["y"], "b.png", { type: "image/png" }));
    finishText({ result: true, threadIdx: 501 });
    // 보낸 a.png는 입력창에서 빠지고 b.png만 남음
    await waitFor(() =>
      expect(screen.queryByAltText("a.png")).not.toBeInTheDocument(),
    );
    expect(screen.getByAltText("b.png")).toBeInTheDocument();
    // 올리던 첨부 작업이 끝날 때까지 기다려 다음 테스트에 남기지 않음
    await waitFor(() =>
      expect(useInquiryUploadStore.getState().jobs).toEqual({}),
    );
  });

  it("전송이 실패하면 입력을 지우지 않고 안내한다", async () => {
    const user = userEvent.setup();
    mockTimeline();
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

  it("3000자를 넘겨 들어온 입력은 3000자까지만 받고 그만큼만 보낸다", async () => {
    mockTimeline();
    vi.mocked(serverApiV3.post).mockResolvedValue({
      result: true,
      threadIdx: 501,
    });
    renderComposer();
    await waitFor(() => expect(screen.getByRole("textbox")).toBeEnabled());
    // 브라우저가 maxLength를 건너뛰는 입력(한글 조합 확정 등)을 흉내 냄.
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "가".repeat(3010) },
    });
    expect(screen.getByRole("textbox")).toHaveValue("가".repeat(3000));
    expect(screen.queryByText("3010")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "전송" }));
    await waitFor(() =>
      expect(serverApiV3.post).toHaveBeenCalledWith(
        "/help/thread/message",
        expect.objectContaining({ body: "가".repeat(3000) }),
        expect.anything(),
      ),
    );
  });

  it("쓰기를 꺼 두면 입력창은 보이지만 비활성이라 보낼 수 없다", async () => {
    flags.isWriteEnabled = false;
    mockTimeline();
    renderComposer();
    // 대화(스레드)를 받은 뒤에도 입력은 막혀 있어야 함.
    await waitFor(() => expect(serverApiV3.get).toHaveBeenCalled());
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "전송" })).toBeDisabled();
    expect(serverApiV3.post).not.toHaveBeenCalled();
  });
});
