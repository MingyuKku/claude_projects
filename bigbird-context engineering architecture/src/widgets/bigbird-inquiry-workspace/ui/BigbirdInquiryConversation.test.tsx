import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { SWRConfig } from "swr";

import { useInquiryUploadStore } from "@/entities/inquiry";

import { BigbirdInquiryConversation } from "./BigbirdInquiryConversation";

import type { BigbirdInquiryViewModel } from "@/entities/inquiry";

// 상담 문서 구독은 네트워크 경계라 응답을 주지 않는 것으로 대신함(대화 목록은 로딩 상태).
vi.mock("@/shared/api", () => ({ getFirestoreDb: async () => ({}) }));
vi.mock("firebase/firestore", () => ({
  doc: () => ({}),
  onSnapshot: () => () => {},
}));

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

function renderConversation(value: BigbirdInquiryViewModel) {
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <MemoryRouter>
        <BigbirdInquiryConversation
          inquiry={value}
          myName="김빅링크"
          threadUserIdx={5971}
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
        "상담원 연결은 고객 문의 상황에 따라 최대 5분이 소요될 수 있습니다.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "전송" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "상담 종료" })).toBeDisabled();
  });

  it("요청 실패 카드는 재시도·문의 메시지로 남기기를 보여 주되 연동 전에는 비활성이다", () => {
    renderConversation(inquiry({ status: "failed", realtimePhase: "failed" }));
    expect(screen.getByText("상담 요청 실패")).toBeInTheDocument();
    expect(screen.getByText("요청 실패")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "재시도" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "문의 메시지로 남기기" }),
    ).toBeDisabled();
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("상담 중에는 안내 카드가 없다", () => {
    renderConversation(
      inquiry({ status: "consulting", realtimePhase: "connected" }),
    );
    expect(screen.queryByText("상담 요청 중")).not.toBeInTheDocument();
    expect(screen.getByText("상담 중")).toBeInTheDocument();
  });

  it("연동한 쓰기 핸들러가 있으면 버튼이 활성이다", () => {
    const onClickRetry = vi.fn();
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <MemoryRouter>
          <BigbirdInquiryConversation
            inquiry={inquiry({ status: "failed", realtimePhase: "failed" })}
            myName="김빅링크"
            threadUserIdx={5971}
            onClickRetry={onClickRetry}
          />
        </MemoryRouter>
      </SWRConfig>,
    );
    expect(screen.getByRole("button", { name: "재시도" })).toBeEnabled();
  });

  it("종료된 상담은 완료 카드만 있고 입력창이 없으며 상담 종료는 비활성이다", () => {
    renderConversation(
      inquiry({ isFinished: true, status: "done", realtimePhase: "finished" }),
    );
    expect(screen.getByText("완료된 상담")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "상담 종료" })).toBeDisabled();
  });

  it("일반 문의에는 상담 종료 버튼과 입력창이 없다", () => {
    renderConversation(
      inquiry({ isRealtime: false, realtimePhase: null, status: "waiting" }),
    );
    expect(
      screen.queryByRole("button", { name: "상담 종료" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
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
    expect(screen.getByRole("status")).toHaveTextContent(
      "첨부 업로드 중 (1/2)",
    );

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
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
