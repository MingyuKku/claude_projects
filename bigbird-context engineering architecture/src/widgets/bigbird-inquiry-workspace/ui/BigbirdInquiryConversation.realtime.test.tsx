import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { SWRConfig } from "swr";

import { BigbirdInquiryConversation } from "./BigbirdInquiryConversation";

import type { BigbirdInquiryViewModel } from "@/entities/inquiry";

const state = vi.hoisted(() => ({ onlyCard: false }));

const card = JSON.stringify({
  mainImageUrl: null,
  campaignCode: "L-1",
  brandName: "브랜드",
  productName: "다이노키키",
});

// 실시간 상담 문서에 캠페인 카드(auto)와 운영자 답변이 있는 상태를 구독으로 돌려줌.
vi.mock("@/shared/api", () => ({ getFirestoreDb: async () => ({}) }));
vi.mock("firebase/firestore", () => ({
  doc: () => ({}),
  onSnapshot: (
    _ref: unknown,
    onData: (snapshot: { exists: () => boolean; data: () => unknown }) => void,
  ) => {
    onData({
      exists: () => true,
      data: () => ({
        sequence: 7,
        threadIdx: 101,
        isConnect: true,
        finishTime: null,
        messages: state.onlyCard
          ? [
              {
                auto: true,
                attachmentIdx: null,
                identifier: null,
                isUserMessage: false,
                body: card,
                created: "2026-10-19 16:26:00",
              },
            ]
          : [
              {
                auto: true,
                attachmentIdx: null,
                identifier: null,
                isUserMessage: false,
                body: card,
                created: "2026-10-19 16:26:00",
              },
              {
                auto: false,
                attachmentIdx: null,
                identifier: "op",
                isUserMessage: false,
                body: "안녕하세요 운영자입니다",
                created: "2026-10-19 16:27:00",
              },
            ],
      }),
    });
    return () => {};
  },
}));

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const inquiry: BigbirdInquiryViewModel = {
  threadIdx: 101,
  sequence: 7,
  campaignIdx: 10,
  isRealtime: true,
  isFinished: false,
  status: "consulting",
  realtimePhase: "connected",
  createdAt: new Date("2026-10-19T16:26:00"),
  messages: [],
};

it("실시간 상담 대화에 캠페인 카드와 운영자 메시지를 함께 보여 준다", async () => {
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <MemoryRouter>
        <BigbirdInquiryConversation
          inquiry={inquiry}
          myName="김빅링크"
          threadUserIdx={5971}
        />
      </MemoryRouter>
    </SWRConfig>,
  );
  expect(
    await screen.findByText("안녕하세요 운영자입니다"),
  ).toBeInTheDocument();
  expect(screen.getByText("다이노키키")).toBeInTheDocument();
});

it("요청 중에도 캠페인 카드를 보여 주고 빈 상담 안내는 띄우지 않는다", async () => {
  state.onlyCard = true;
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <MemoryRouter>
        <BigbirdInquiryConversation
          inquiry={{
            ...inquiry,
            realtimePhase: "requesting",
            status: "waiting",
          }}
          myName="김빅링크"
          threadUserIdx={5971}
        />
      </MemoryRouter>
    </SWRConfig>,
  );
  // 구독 응답이 오면 로딩 표시가 사라짐. 그 뒤의 화면을 확인함.
  await waitFor(() =>
    expect(screen.queryByLabelText("불러오는 중…")).not.toBeInTheDocument(),
  );
  expect(screen.getByText("다이노키키")).toBeInTheDocument();
  expect(screen.queryByText("상담 메시지가 없습니다.")).not.toBeInTheDocument();
  state.onlyCard = false;
});

it("요청 실패 카드에 시안의 안내 문구와 작은 글씨를 보여 준다", async () => {
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <MemoryRouter>
        <BigbirdInquiryConversation
          inquiry={{ ...inquiry, realtimePhase: "failed", status: "failed" }}
          myName="김빅링크"
          threadUserIdx={5971}
        />
      </MemoryRouter>
    </SWRConfig>,
  );
  await waitFor(() =>
    expect(screen.queryByLabelText("불러오는 중…")).not.toBeInTheDocument(),
  );
  expect(
    screen.getByText("문의를 남겨주시면 확인 후 순차적으로 답변드립니다."),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "문의 메시지 답변은 고객 문의 상황에 따라 지연될 수 있습니다.",
    ),
  ).toBeInTheDocument();
});
