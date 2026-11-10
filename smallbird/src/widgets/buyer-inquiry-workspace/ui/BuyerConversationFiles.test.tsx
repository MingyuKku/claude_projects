import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";

import { BuyerConversation } from "./BuyerConversation";

import type { BuyerInquiryViewModel } from "@/entities/inquiry";

const toast = vi.hoisted(() => Object.assign(vi.fn(), { error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getFirestoreDb: async () => ({}),
    serverApiV3: { get: vi.fn(), put: vi.fn(), delete: vi.fn() },
  };
});

// 구매자 문의(실시간 줄이 없는 출처)로 텍스트+첨부 묶음의 수정·삭제만 확인함.
const inquiry: BuyerInquiryViewModel = {
  key: "purchaser-501",
  inquiryIdx: 501,
  source: "purchaser",
  status: "waiting",
  campaignIdx: 10,
  orderNumber: null,
  writerName: "이예형",
  body: "문의",
  writeTime: new Date("2026-10-01T10:05"),
  threadUserIdx: 77,
  userIdx: null,
  sequence: null,
  preview: "문의",
  lastActivityAt: new Date("2026-10-01T10:05"),
  hasUnread: false,
  brandName: null,
  campaignName: null,
  shopName: null,
  influencerNickname: null,
};

// userIdx가 상대(77)가 아니면 내 메시지.
const message = (
  messageIdx: number,
  body: string,
  options: {
    userIdx?: number;
    time?: string;
    readTime?: string | null;
    deleteTime?: string | null;
    attachmentIdx?: number | null;
  } = {},
) => ({
  messageIdx,
  threadIdx: 501,
  body,
  userIdx: options.userIdx ?? 1,
  sequence: null,
  attachmentIdx: options.attachmentIdx ?? null,
  writeTime: options.time ?? "2026-10-01T10:00:00",
  readTime: options.readTime ?? null,
  modifyTime: null,
  deleteTime: options.deleteTime ?? null,
  identifier: "mgkang",
  isUserMessage: true,
  fileName: options.attachmentIdx ? `file-${messageIdx}.png` : null,
  fileSize: options.attachmentIdx ? 100 : null,
  fileType: options.attachmentIdx ? "image/png" : null,
  auto: false,
});

function mockThread(messages: ReturnType<typeof message>[]) {
  vi.mocked(serverApiV3.get).mockResolvedValue({
    result: true,
    data: [
      {
        threadIdx: 501,
        sequence: 1318,
        viewing: null,
        toUserIdx: 77,
        fmUserIdx: 1,
        campaignIdx: 10,
        finishTime: null,
        created: "2026-10-01T10:00:00",
        boardType: true,
        status: "WAITING",
        messages,
      },
    ],
  });
}

function renderConversation() {
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <BuyerConversation inquiry={inquiry} />
    </SWRConfig>,
  );
}

// 텍스트(10:00) 바로 뒤에 같은 쪽 첨부 두 장 → 한 묶음 행.
const mineGrouped = [
  message(10, "첨부 드립니다", { time: "2026-10-01T10:00:00" }),
  message(11, "https://cdn/a.png", {
    time: "2026-10-01T10:00:03",
    attachmentIdx: 5,
  }),
  message(12, "https://cdn/b.png", {
    time: "2026-10-01T10:00:04",
    attachmentIdx: 6,
  }),
];

beforeEach(() => {
  vi.clearAllMocks();
  // jsdom에는 matchMedia가 없어 터치 기기(hover 없음)로 흉내 냄. 툴바가 말풍선 탭으로 열림.
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

describe("텍스트+첨부 묶음의 수정·삭제", () => {
  it("묶인 내 텍스트에도 수정·삭제 툴바가 뜨고 첨부는 그대로 보인다", async () => {
    const user = userEvent.setup();
    mockThread(mineGrouped);
    renderConversation();
    await user.click(await screen.findByText("첨부 드립니다"));
    expect(await screen.findByRole("button", { name: "수정" })).toBeVisible();
    expect(screen.getByRole("button", { name: "삭제" })).toBeVisible();
    expect(screen.getByAltText("file-11.png")).toBeInTheDocument();
    expect(screen.getByAltText("file-12.png")).toBeInTheDocument();
  });

  it("삭제하면 그 텍스트 메시지만 삭제를 요청하고 첨부 메시지는 건드리지 않는다", async () => {
    const user = userEvent.setup();
    mockThread(mineGrouped);
    vi.mocked(serverApiV3.delete).mockResolvedValue({ result: true });
    renderConversation();
    await user.click(await screen.findByText("첨부 드립니다"));
    await user.click(await screen.findByRole("button", { name: "삭제" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "삭제",
      }),
    );
    await waitFor(() =>
      expect(serverApiV3.delete).toHaveBeenCalledWith(
        "/help/thread/message/10",
      ),
    );
    expect(serverApiV3.delete).toHaveBeenCalledOnce();
    expect(toast).toHaveBeenCalled();
  });

  it("삭제된 뒤에는 텍스트가 빠지고 첨부만 남은 행으로 바뀐다", async () => {
    const user = userEvent.setup();
    mockThread(mineGrouped);
    vi.mocked(serverApiV3.delete).mockImplementation(async () => {
      // 삭제 뒤 다시 받은 대화: 텍스트에 삭제 시각이 붙음
      mockThread([
        { ...mineGrouped[0]!, deleteTime: "2026-10-01T10:01:00" },
        mineGrouped[1]!,
        mineGrouped[2]!,
      ]);
      return { result: true };
    });
    renderConversation();
    await user.click(await screen.findByText("첨부 드립니다"));
    await user.click(await screen.findByRole("button", { name: "삭제" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "삭제",
      }),
    );
    await waitFor(() =>
      expect(screen.queryByText("첨부 드립니다")).not.toBeInTheDocument(),
    );
    expect(screen.getByAltText("file-11.png")).toBeInTheDocument();
    expect(screen.getByAltText("file-12.png")).toBeInTheDocument();
  });

  it("수정하면 그 텍스트 메시지의 본문만 고친다", async () => {
    const user = userEvent.setup();
    mockThread(mineGrouped);
    vi.mocked(serverApiV3.put).mockResolvedValue({ result: true });
    renderConversation();
    await user.click(await screen.findByText("첨부 드립니다"));
    await user.click(await screen.findByRole("button", { name: "수정" }));
    const box = screen.getByRole("textbox", { name: "메시지 수정" });
    await user.clear(box);
    await user.type(box, "고친 글");
    await user.click(screen.getByRole("button", { name: "완료" }));
    await waitFor(() =>
      expect(serverApiV3.put).toHaveBeenCalledWith("/help/thread/message", {
        messageIdx: 10,
        body: "고친 글",
      }),
    );
    expect(serverApiV3.put).toHaveBeenCalledOnce();
    // 수정하는 동안에도 첨부는 그대로 보임
    expect(screen.getByAltText("file-11.png")).toBeInTheDocument();
  });

  it("상대가 읽은 메시지·상대 메시지에는 툴바가 없다", async () => {
    const user = userEvent.setup();
    mockThread([
      message(20, "읽힌 글", {
        time: "2026-10-01T10:00:00",
        readTime: "2026-10-01T10:00:30",
      }),
      message(21, "https://cdn/c.png", {
        time: "2026-10-01T10:00:03",
        attachmentIdx: 7,
      }),
      message(30, "상대 글", { userIdx: 77, time: "2026-10-01T10:05:00" }),
      message(31, "https://cdn/d.png", {
        userIdx: 77,
        time: "2026-10-01T10:05:03",
        attachmentIdx: 8,
      }),
    ]);
    renderConversation();
    await user.click(await screen.findByText("읽힌 글"));
    await user.click(screen.getByText("상대 글"));
    expect(
      screen.queryByRole("button", { name: "수정" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "삭제" }),
    ).not.toBeInTheDocument();
  });
});
