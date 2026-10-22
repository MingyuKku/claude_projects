import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";

import { ApiError, serverApiV3 } from "@/shared/api";

import { QnaConversation } from "./QnaConversation";

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
  key: "qna-501",
  inquiryIdx: 501,
  source: "qna",
  status: "waiting",
  campaignIdx: 10,
  orderNumber: null,
  writerName: "김하루",
  body: "질문",
  writeTime: new Date("2026-10-01T10:00"),
  threadUserIdx: null,
  userIdx: 9,
  preview: "질문",
  lastActivityAt: new Date("2026-10-01T10:00"),
};

function qna(replyInfo: Record<string, unknown>) {
  return {
    result: true,
    list: [
      {
        campaignInfo: {
          productName: "상품",
          mainImageUrl: null,
          optionName: null,
        },
        inquiryInfo: {
          inquiryIdx: 501,
          body: "언제 입고되나요?",
          writeTime: "2026-10-01 10:00",
          modifyTime: null,
          inquiryType: null,
          deleteTime: null,
          deleteId: null,
        },
        replyInfo,
      },
    ],
  };
}

const unread = {
  replyIdx: 5,
  body: "내일 입고됩니다.",
  writeTime: "2026-10-01 11:00",
  readTime: null,
};

function renderQna() {
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <QnaConversation inquiry={inquiry} />
    </SWRConfig>,
  );
}

beforeEach(() => {
  flags.isWriteEnabled = true;
  vi.clearAllMocks();
});

describe("상품 Q&A 대화", () => {
  it("답변이 없으면 입력창을 보여 주고 등록하면 최신 상태를 다시 받는다", async () => {
    const user = userEvent.setup();
    vi.mocked(serverApiV3.post).mockImplementation(async (path: string) =>
      path === "/help/qna" ? qna({}) : { result: true, status: "ok" },
    );
    renderQna();
    expect(await screen.findByText("언제 입고되나요?")).toBeInTheDocument();
    await user.type(screen.getByRole("textbox"), "내일 입고됩니다.");
    await user.click(screen.getByRole("button", { name: "답변 등록" }));
    await waitFor(() =>
      expect(serverApiV3.post).toHaveBeenCalledWith("/help/reply", {
        inquiryIdx: 501,
        body: "내일 입고됩니다.",
      }),
    );
    // 등록 뒤 목록을 다시 받는다(qna 조회가 두 번).
    await waitFor(() =>
      expect(
        vi
          .mocked(serverApiV3.post)
          .mock.calls.filter(([path]) => path === "/help/qna"),
      ).toHaveLength(2),
    );
  });

  it("읽히지 않은 답변은 수정·삭제할 수 있고, 수정은 같은 답변을 고친다", async () => {
    const user = userEvent.setup();
    vi.mocked(serverApiV3.post).mockResolvedValue(qna(unread));
    vi.mocked(serverApiV3.put).mockResolvedValue({ result: true });
    renderQna();
    expect(await screen.findByText("내일 입고됩니다.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "수정" }));
    const box = screen.getByRole("textbox");
    expect(box).toHaveValue("내일 입고됩니다.");
    await user.clear(box);
    await user.type(box, "모레 입고됩니다.");
    await user.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() =>
      expect(serverApiV3.put).toHaveBeenCalledWith("/help/reply", {
        replyIdx: 5,
        body: "모레 입고됩니다.",
      }),
    );
  });

  it("삭제는 확인 후에 보내고, 이미 읽힌 답변(409)이면 이유를 알린다", async () => {
    const user = userEvent.setup();
    vi.mocked(serverApiV3.post).mockResolvedValue(qna(unread));
    vi.mocked(serverApiV3.delete).mockRejectedValue(new ApiError(409, null));
    renderQna();
    await screen.findByText("내일 입고됩니다.");
    await user.click(screen.getByRole("button", { name: "삭제" }));
    expect(serverApiV3.delete).not.toHaveBeenCalled();
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "삭제",
      }),
    );
    await waitFor(() =>
      expect(serverApiV3.delete).toHaveBeenCalledWith("/help/reply/5"),
    );
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "구매자가 읽은 답변은 수정·삭제할 수 없습니다.",
      ),
    );
  });

  it("구매자가 읽은 답변에는 수정·삭제 버튼이 없다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValue(
      qna({ ...unread, readTime: "2026-10-01 12:00" }),
    );
    renderQna();
    await screen.findByText("내일 입고됩니다.");
    expect(
      screen.queryByRole("button", { name: "수정" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "삭제" }),
    ).not.toBeInTheDocument();
  });

  it("쓰기를 꺼 두면 답변 입력은 비활성이고 읽히지 않은 답변의 수정·삭제 버튼도 숨긴다", async () => {
    flags.isWriteEnabled = false;
    vi.mocked(serverApiV3.post).mockResolvedValue(qna({ ...unread }));
    renderQna();
    await screen.findByText("내일 입고됩니다.");
    expect(
      screen.queryByRole("button", { name: "수정" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "삭제" }),
    ).not.toBeInTheDocument();
  });

  it("쓰기를 꺼 두면 답변이 없는 질문의 입력창은 비활성이다", async () => {
    flags.isWriteEnabled = false;
    vi.mocked(serverApiV3.post).mockResolvedValue(qna({}));
    renderQna();
    await screen.findByText("언제 입고되나요?");
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "답변 등록" })).toBeDisabled();
  });
});
