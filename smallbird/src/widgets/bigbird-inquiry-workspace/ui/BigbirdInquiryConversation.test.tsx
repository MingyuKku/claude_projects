import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { SWRConfig } from "swr";

import { useInquiryUploadStore } from "@/entities/inquiry";

import { BigbirdInquiryConversation } from "./BigbirdInquiryConversation";

import type { BigbirdInquiryViewModel } from "@/entities/inquiry";

// 상담 문서 구독은 네트워크 경계라 응답을 주지 않는 것으로 대신함(대화 목록은 로딩 상태).
const get = vi.hoisted(() => vi.fn());
vi.mock("@/shared/api", () => ({
  getFirestoreDb: async () => ({}),
  serverApiV3: { get },
  isApiError: () => false,
}));
vi.mock("firebase/firestore", () => ({
  doc: () => ({}),
  onSnapshot: () => () => {},
}));

// 기타 문의 대화(상세 API)는 기본으로 빈 대화를 줌.
beforeEach(() => {
  get.mockResolvedValue({ result: true, data: { messages: [] } });
});

// Radix ScrollArea가 쓰는 브라우저 API가 jsdom에 없어 이 파일에서만 채움.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

function inquiry(
  overrides: Partial<BigbirdInquiryViewModel> = {},
): BigbirdInquiryViewModel {
  return {
    threadIdx: 101,
    sequence: 7,
    campaignIdx: null,
    isRealtime: true,
    isFinished: false,
    status: "waiting",
    realtimePhase: "requesting",
    createdAt: new Date("2026-10-19T10:00:00"),
    messages: [],
    ...overrides,
  };
}

function renderConversation(
  value: BigbirdInquiryViewModel,
  onClickRealtime?: () => void,
) {
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <MemoryRouter>
        <BigbirdInquiryConversation
          inquiry={value}
          myName="김빅링크"
          threadUserIdx={5971}
          onClickRealtime={onClickRealtime}
        />
      </MemoryRouter>
    </SWRConfig>,
  );
}

describe("실시간 상담 대화", () => {
  it("연결 대기 중에는 요청 중 카드를 보여 주고 입력·상담 종료는 비활성이다", () => {
    renderConversation(inquiry());
    expect(screen.getByText("상담 요청 중")).toBeInTheDocument();
    expect(
      screen.getByText(
        "상담원 연결은 고객 문의 상황에 따라 최대 3분이 소요될 수 있습니다.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "전송" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "상담 종료" })).toBeDisabled();
  });

  it("연결 실패 카드는 버튼 없이 안내만 하고 10초 뒤 사라지며, 입력은 일반 문의로 보낸다", () => {
    vi.useFakeTimers();
    try {
      renderConversation(
        inquiry({ status: "failed", realtimePhase: "failed" }),
      );
      expect(screen.getByText("실시간 상담 불가")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "재시도" }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("textbox")).toBeEnabled();
      act(() => {
        vi.advanceTimersByTime(10_000);
      });
      expect(screen.queryByText("실시간 상담 불가")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
  it("상담 중에는 안내 카드가 없다", () => {
    renderConversation(
      inquiry({ status: "consulting", realtimePhase: "connected" }),
    );
    expect(screen.queryByText("상담 요청 중")).not.toBeInTheDocument();
    // 헤더 배지는 목록 탭의 "상담 중"이 아니라 "실시간 상담중"(REQ-23-0018)
    expect(screen.getByText("실시간 상담중")).toBeInTheDocument();
    expect(screen.queryByText("상담 중")).not.toBeInTheDocument();
  });

  it("종료된 상담은 완료 카드와 입력창이 있고 상담 종료는 비활성이다", () => {
    renderConversation(
      inquiry({ isFinished: true, status: "done", realtimePhase: "finished" }),
    );
    expect(screen.getByText("완료된 상담")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeEnabled();
    expect(screen.getByRole("button", { name: "상담 종료" })).toBeDisabled();
  });

  it("열린 일반 문의에는 입력창이 있고 상담 종료 버튼은 없다", () => {
    renderConversation(
      inquiry({ isRealtime: false, realtimePhase: null, status: "waiting" }),
    );
    expect(
      screen.queryByRole("button", { name: "상담 종료" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeEnabled();
  });

  it("열린 일반 문의의 실시간 상담하기 버튼을 누르면 실시간 상담을 요청한다", async () => {
    const onClickRealtime = vi.fn();
    renderConversation(
      inquiry({ isRealtime: false, realtimePhase: null, status: "waiting" }),
      onClickRealtime,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "실시간 상담하기" }),
    );

    expect(onClickRealtime).toHaveBeenCalledOnce();
  });

  it("실시간 상담 중인 문의에는 실시간 상담하기 버튼이 없다", () => {
    renderConversation(inquiry(), vi.fn());
    expect(
      screen.queryByRole("button", { name: "실시간 상담하기" }),
    ).not.toBeInTheDocument();
  });

  it("답변 완료·종료된 일반 문의에도 실시간 상담하기 버튼이 있다", async () => {
    const onClickRealtime = vi.fn();
    renderConversation(
      inquiry({
        isRealtime: false,
        realtimePhase: null,
        isFinished: true,
        status: "done",
      }),
      onClickRealtime,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "실시간 상담하기" }),
    );
    expect(onClickRealtime).toHaveBeenCalledOnce();
  });

  it("종료된 일반 문의도 입력창이 있고 완료된 상담 안내는 뜨지 않는다", () => {
    renderConversation(
      inquiry({
        isRealtime: false,
        realtimePhase: null,
        isFinished: true,
        status: "done",
      }),
    );
    // 일반 문의가 답변 완료·종료된 것만으로는 안내가 뜨지 않음.
    expect(screen.queryByText("완료된 상담")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeEnabled();
  });

  describe("완료된 상담 안내", () => {
    const message = (
      id: number,
      body: string,
      kind: "text" | "notice" = "text",
    ) => ({
      id,
      isMine: false,
      kind,
      body,
      createdAt: new Date(`2026-10-19T10:0${id}:00`),
      isDeleted: false,
      isRead: false,
      isEdited: false,
      senderId: null,
      campaign: null,
      attachment: null,
    });
    const general = {
      isRealtime: false,
      realtimePhase: null,
      status: "done" as const,
    };

    it("실시간 종료 안내가 대화의 마지막이면 보인다", () => {
      renderConversation(
        inquiry({
          ...general,
          messages: [
            message(1, "문의합니다"),
            message(2, "상담이 종료되었습니다.", "notice"),
          ],
        }),
      );
      expect(screen.getByText("완료된 상담")).toBeInTheDocument();
    });

    it("실시간이 다시 시작돼 진행 중이면 마지막 메시지가 예전 종료 안내여도 안 보인다", () => {
      renderConversation(
        inquiry({
          isRealtime: true,
          isFinished: false,
          realtimePhase: "requesting",
          status: "waiting",
          messages: [
            message(1, "문의합니다"),
            message(2, "상담이 종료되었습니다.", "notice"),
          ],
        }),
      );
      expect(screen.queryByText("완료된 상담")).not.toBeInTheDocument();
    });

    it("종료 안내 뒤에 일반 메시지가 오면 마지막 상담이 일반이라 안 보인다", () => {
      renderConversation(
        inquiry({
          ...general,
          messages: [
            message(1, "상담이 종료되었습니다.", "notice"),
            message(2, "다시 문의합니다"),
          ],
        }),
      );
      expect(screen.queryByText("완료된 상담")).not.toBeInTheDocument();
    });
  });
});

describe("첨부 메시지", () => {
  const fileMessage = (id: number, name: string) => ({
    id,
    isMine: true,
    kind: "image" as const,
    body: `https://cdn/${name}`,
    createdAt: new Date("2026-10-19T10:00:00"),
    isDeleted: false,
    isRead: false,
    isEdited: false,
    senderId: null,
    campaign: null,
    attachment: {
      attachmentIdx: id,
      fileName: name,
      fileSize: 1,
      fileType: "image",
    },
  });

  it("연달아 보낸 첨부를 한 줄 썸네일로 보여 주고, 누르면 뷰어에서 넘겨 볼 수 있다", async () => {
    const user = userEvent.setup();
    // 상세 응답 전에는 뷰모델에 담긴 메시지를 보여 줌.
    get.mockReturnValue(new Promise(() => {}));
    renderConversation(
      inquiry({
        isRealtime: false,
        realtimePhase: null,
        messages: [
          fileMessage(1, "a.png"),
          fileMessage(2, "b.png"),
          fileMessage(3, "c.png"),
        ],
      }),
    );
    // 세 장이 한 묶음(이름 줄 하나)이다.
    expect(screen.getAllByText("김빅링크")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "b.png" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("이미지 다운로드");
    expect(
      screen.getAllByRole("img", { name: "b.png" }).length,
    ).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "다음" }));
    expect(
      screen.getAllByRole("img", { name: "c.png" }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "다운로드" })).toHaveAttribute(
      "href",
      expect.stringContaining("/v3/help/file/download/image/3"),
    );
    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("첨부 업로드 진행", () => {
  afterEach(() => {
    useInquiryUploadStore.setState({ jobs: {} });
  });
  const files = [new File(["1"], "1.png"), new File(["2"], "2.png")];

  it("업로드 중에는 진행 줄을 보여 주고, 실패하면 남은 개수와 다시 시도를 보여 준다", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    useInquiryUploadStore.setState({
      jobs: { 101: { files, sentCount: 1, status: "uploading" } },
    });
    renderConversation(inquiry({ isRealtime: false, realtimePhase: null }));
    expect(await screen.findByText("첨부 업로드 중 (1/2)")).toBeInTheDocument();

    useInquiryUploadStore.setState({
      jobs: { 101: { files, sentCount: 1, status: "failed" } },
      retry,
    });
    expect(
      await screen.findByText("첨부 1개를 보내지 못했습니다."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(retry).toHaveBeenCalledWith(101);
  });

  it("다른 문의의 업로드는 이 문의 화면에 보이지 않는다", () => {
    useInquiryUploadStore.setState({
      jobs: { 999: { files, sentCount: 0, status: "uploading" } },
    });
    renderConversation(inquiry({ isRealtime: false, realtimePhase: null }));
    expect(screen.queryByText(/첨부 업로드 중/)).not.toBeInTheDocument();
  });
});

describe("대화 불러오기", () => {
  it("대화를 받지 못하면 빈 대화 대신 오류와 다시 시도를 보이고, 다시 시도하면 다시 받는다", async () => {
    get.mockRejectedValue(new Error("network"));
    renderConversation(inquiry({ isRealtime: false, realtimePhase: null }));

    expect(
      await screen.findByText("대화를 불러오지 못했습니다."),
    ).toBeInTheDocument();
    const callCount = get.mock.calls.length;
    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(get.mock.calls.length).toBeGreaterThan(callCount);
  });
});
