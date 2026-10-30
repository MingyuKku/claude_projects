import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { ApiError, serverApiV3 } from "@/shared/api";

import { EditableChatMessage } from "./EditableChatMessage";

import type { InquiryMessageViewModel } from "@/entities/inquiry";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    serverApiV3: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  };
});
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

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
  props: { canModify?: boolean; onChanged?: () => void } = {},
) {
  const onChanged = props.onChanged ?? vi.fn();
  render(
    <EditableChatMessage
      message={message(overrides)}
      name="광고주"
      time="10:00"
      canModify={props.canModify ?? true}
      onChanged={onChanged}
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
  });

  it("삭제는 확인 뒤에 DELETE로 보낸다", async () => {
    const user = userEvent.setup();
    vi.mocked(serverApiV3.delete).mockResolvedValue({ result: true });
    const onChanged = renderMessage();
    await user.click(screen.getByText("배송 문의드립니다"));
    await user.click(screen.getByRole("button", { name: "삭제" }));
    expect(serverApiV3.delete).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "삭제" }));
    expect(serverApiV3.delete).toHaveBeenCalledWith("/help/thread/message/7");
    expect(onChanged).toHaveBeenCalledOnce();
  });

  it("이미 읽혀 409면 안내하고 최신 상태를 다시 받는다", async () => {
    const user = userEvent.setup();
    vi.mocked(serverApiV3.put).mockRejectedValue(new ApiError(409, {}));
    const onChanged = renderMessage();
    await user.click(screen.getByText("배송 문의드립니다"));
    await user.click(screen.getByRole("button", { name: "수정" }));
    await user.type(screen.getByRole("textbox"), "!");
    await user.click(screen.getByRole("button", { name: "완료" }));
    expect(toast.error).toHaveBeenCalledWith(
      "상대가 읽은 메시지는 수정·삭제할 수 없습니다.",
    );
    expect(onChanged).toHaveBeenCalledOnce();
  });

  it("수정된 메시지에는 편집됨을 보여 준다", () => {
    renderMessage({ isEdited: true });
    expect(screen.getByText("편집됨")).toBeInTheDocument();
  });
});
