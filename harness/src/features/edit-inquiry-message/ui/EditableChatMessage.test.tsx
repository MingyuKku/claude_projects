import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { ApiError, serverApiV3 } from "@/shared/api";

import { EditableChatMessage } from "./EditableChatMessage";

import type {
  DeletedInquiryMessage,
  InquiryMessageViewModel,
} from "@/entities/inquiry";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    serverApiV3: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  };
});
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

// jsdom에는 matchMedia가 없어 터치 기기(hover 없음)로 흉내 냅니다. 툴바가 말풍선 탭으로 열립니다.
beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: query === "(hover: none)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});
afterEach(() => vi.unstubAllGlobals());

function message(
  overrides: Partial<InquiryMessageViewModel> = {},
): InquiryMessageViewModel {
  return {
    id: 7,
    isMine: true,
    kind: "text",
    body: "배송 문의드립니다",
    createdAt: new Date("2026-10-21T10:00"),
    isDeleted: false,
    isRead: false,
    isEdited: false,
    senderId: null,
    campaign: null,
    attachment: null,
    ...overrides,
  };
}

function renderMessage(
  overrides: Partial<InquiryMessageViewModel> = {},
  props: {
    canModify?: boolean;
    onChanged?: () => void;
    onDeleted?: (deleted: DeletedInquiryMessage) => void;
  } = {},
) {
  const onChanged = props.onChanged ?? vi.fn();
  render(
    <EditableChatMessage
      message={message(overrides)}
      name="광고주"
      time="10:00"
      canModify={props.canModify ?? true}
      onChanged={onChanged}
      onDeleted={props.onDeleted}
    />,
  );
  return onChanged;
}

describe("EditableChatMessage", () => {
  it("읽지 않은 내 텍스트 메시지를 누르면 수정·삭제 툴바가 열린다", async () => {
    const user = userEvent.setup();
    renderMessage();
    await user.click(screen.getByText("배송 문의드립니다"));
    expect(screen.getByRole("button", { name: "수정" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "삭제" })).toBeInTheDocument();
  });

  it.each([
    ["상대가 읽은 메시지", { isRead: true }, true],
    ["상대가 보낸 메시지", { isMine: false }, true],
    ["첨부 메시지", { kind: "image" as const }, true],
    ["서버 번호가 없는 임시 메시지", { id: -2 }, true],
    ["수정을 허용하지 않는 대화", {}, false],
  ])("%s에는 툴바가 없다", async (_, overrides, canModify) => {
    const user = userEvent.setup();
    renderMessage(overrides, { canModify });
    await user.click(screen.getByText(/배송 문의드립니다|https?:/));
    expect(
      screen.queryByRole("button", { name: "수정" }),
    ).not.toBeInTheDocument();
  });

  it("수정하면 본문만 PUT으로 보내고 대화를 다시 받는다", async () => {
    const user = userEvent.setup();
    vi.mocked(serverApiV3.put).mockResolvedValue({ result: true });
    const onChanged = renderMessage();
    await user.click(screen.getByText("배송 문의드립니다"));
    await user.click(screen.getByRole("button", { name: "수정" }));
    const box = screen.getByRole("textbox", { name: "메시지 수정" });
    await user.clear(box);
    await user.type(box, "수정한 내용");
    await user.click(screen.getByRole("button", { name: "완료" }));
    expect(serverApiV3.put).toHaveBeenCalledWith("/help/thread/message", {
      messageIdx: 7,
      body: "수정한 내용",
    });
    expect(onChanged).toHaveBeenCalledOnce();
    // 토스트는 삭제에만 띄움
    expect(toast).not.toHaveBeenCalled();
  });

  it("삭제는 확인 뒤에 DELETE로 보내고, 성공하면 삭제 토스트를 띄운다", async () => {
    const user = userEvent.setup();
    vi.mocked(serverApiV3.delete).mockResolvedValue({ result: true });
    const onChanged = renderMessage();
    await user.click(screen.getByText("배송 문의드립니다"));
    await user.click(screen.getByRole("button", { name: "삭제" }));
    expect(serverApiV3.delete).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "삭제" }));
    expect(serverApiV3.delete).toHaveBeenCalledWith("/help/thread/message/7");
    expect(onChanged).toHaveBeenCalledOnce();
    expect(toast).toHaveBeenCalledWith("메시지가 삭제되었습니다.");
  });

  it("삭제 응답이 삭제된 메시지면 onDeleted로 그 자리만 바꾸고 대화를 다시 받지 않는다", async () => {
    const user = userEvent.setup();
    const deleted = {
      messageIdx: 7,
      threadIdx: 10,
      body: "삭제된 메시지입니다",
      userIdx: 5,
      attachmentIdx: null,
      writeTime: "2026-10-21T10:00:00",
      readTime: null,
      modifyTime: null,
      deleteTime: "2026-10-21T10:05:00",
      identifier: "mgkang",
      isUserMessage: true,
      fileName: null,
      fileSize: null,
      fileType: null,
      auto: false,
    };
    vi.mocked(serverApiV3.delete).mockResolvedValue(deleted);
    const onDeleted = vi.fn();
    const onChanged = renderMessage({}, { onDeleted });
    await user.click(screen.getByText("배송 문의드립니다"));
    await user.click(screen.getByRole("button", { name: "삭제" }));
    await user.click(screen.getByRole("button", { name: "삭제" }));
    expect(onDeleted).toHaveBeenCalledWith(
      expect.objectContaining({
        messageIdx: 7,
        deleteTime: deleted.deleteTime,
      }),
    );
    expect(onChanged).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith("메시지가 삭제되었습니다.");
  });

  it("삭제 응답에 메시지가 없으면(예전 응답) onDeleted 대신 대화를 다시 받는다", async () => {
    const user = userEvent.setup();
    vi.mocked(serverApiV3.delete).mockResolvedValue({ result: true });
    const onDeleted = vi.fn();
    const onChanged = renderMessage({}, { onDeleted });
    await user.click(screen.getByText("배송 문의드립니다"));
    await user.click(screen.getByRole("button", { name: "삭제" }));
    await user.click(screen.getByRole("button", { name: "삭제" }));
    expect(onDeleted).not.toHaveBeenCalled();
    expect(onChanged).toHaveBeenCalledOnce();
  });

  it("삭제가 실패하면 삭제 토스트 없이 실패 안내만 띄운다", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(serverApiV3.delete).mockRejectedValue(new ApiError(500, {}));
    renderMessage();
    await user.click(screen.getByText("배송 문의드립니다"));
    await user.click(screen.getByRole("button", { name: "삭제" }));
    await user.click(screen.getByRole("button", { name: "삭제" }));
    expect(toast).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      "처리하지 못했습니다. 다시 시도해 주세요.",
    );
  });

  it("이미 읽혀 409면 안내 없이 최신 상태를 다시 받는다", async () => {
    const user = userEvent.setup();
    vi.mocked(serverApiV3.put).mockRejectedValue(new ApiError(409, {}));
    const onChanged = renderMessage();
    await user.click(screen.getByText("배송 문의드립니다"));
    await user.click(screen.getByRole("button", { name: "수정" }));
    await user.type(screen.getByRole("textbox"), "!");
    await user.click(screen.getByRole("button", { name: "완료" }));
    expect(toast.error).not.toHaveBeenCalled();
    expect(onChanged).toHaveBeenCalledOnce();
  });

  it("수정된 메시지에는 편집됨을 보여 준다", () => {
    renderMessage({ isEdited: true });
    expect(screen.getByText("편집됨")).toBeInTheDocument();
  });
});
