import { render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";

import { BuyerConversation } from "./BuyerConversation";

import type { BuyerInquiryViewModel } from "@/entities/inquiry";

const firestore = vi.hoisted(() => ({
  data: undefined as unknown,
  doc: vi.fn(() => ({})),
}));
vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getFirestoreDb: async () => ({}),
    serverApiV3: { get: vi.fn() },
  };
});
vi.mock("firebase/firestore", () => ({
  doc: firestore.doc,
  // 구독하자마자 상담 문서를 한 번 줌. 문서가 없으면(undefined) 없는 문서로 알림.
  onSnapshot: (
    _ref: unknown,
    next: (snapshot: { exists: () => boolean; data: () => unknown }) => void,
  ) => {
    next({
      exists: () => firestore.data !== undefined,
      data: () => firestore.data,
    });
    return () => {};
  },
}));

const inquiry: BuyerInquiryViewModel = {
  key: "influencer-501",
  inquiryIdx: 501,
  source: "influencer",
  status: "done",
  campaignIdx: 10,
  orderNumber: null,
  writerName: "이예형",
  body: "마지막",
  writeTime: new Date("2026-10-01T10:05"),
  threadUserIdx: 77,
  userIdx: null,
  sequence: 1318,
  preview: "마지막",
  lastActivityAt: new Date("2026-10-01T10:05"),
  hasUnread: false,
  brandName: null,
  campaignName: null,
  shopName: null,
  influencerNickname: null,
};

const restMessage = (
  messageIdx: number,
  body: string,
  userIdx: number,
  writeTime: string,
) => ({
  messageIdx,
  threadIdx: 501,
  body,
  userIdx,
  sequence: null,
  attachmentIdx: null,
  writeTime,
  readTime: null,
  modifyTime: null,
  deleteTime: null,
  identifier: userIdx === 77 ? "yylee0" : "mgkang",
  isUserMessage: userIdx !== 77,
  fileName: null,
  fileSize: null,
  fileType: null,
  auto: false,
});

const consultationMessage = (
  created: string,
  body: string,
  kind: "auto" | "requester" | "responder",
) => ({
  auto: kind === "auto",
  attachmentIdx: null,
  identifier: null,
  isUserMessage: kind === "auto" ? false : kind === "requester",
  body,
  created: `2026-10-01 ${created}`,
});

function mockThread() {
  vi.mocked(serverApiV3.get).mockResolvedValue({
    result: true,
    data: [
      {
        threadIdx: 501,
        sequence: 1318,
        viewing: null,
        toUserIdx: 1,
        fmUserIdx: 77,
        campaignIdx: 10,
        finishTime: "2026-10-01T10:03:16",
        created: "2026-10-01T10:00:00",
        boardType: false,
        status: "ANSWERED",
        messages: [
          restMessage(1, "안녕 광고주야", 77, "2026-10-01T10:00:00"),
          restMessage(2, "안녕하세요 광고주입니다", 1, "2026-10-01T10:00:46"),
        ],
      },
    ],
  });
}

function renderConversation(target: BuyerInquiryViewModel) {
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <BuyerConversation inquiry={target} />
    </SWRConfig>,
  );
}

const STARTED = "실시간 상담이 시작되었습니다.";
const ENDED = "실시간 상담이 종료되었습니다.";

beforeEach(() => {
  vi.mocked(serverApiV3.get).mockReset();
  mockThread();
  firestore.data = {
    sequence: 1318,
    threadIdx: 501,
    messages: [
      consultationMessage("10:00:00", "안녕 광고주야", "requester"),
      consultationMessage("10:00:20", "실시간 상담을 요청했습니다.", "auto"),
      consultationMessage("10:00:46", "안녕하세요 광고주입니다", "responder"),
      // 서버가 종료 때 남기는 안내(REST에는 오지 않음)
      consultationMessage("10:03:16", "상담이 종료되었습니다.", "auto"),
    ],
  };
});

describe("인플루언서 문의 대화의 실시간 시작·종료 줄", () => {
  it("연결 첫 응답 앞에 시작 줄, 종료 안내 자리에 종료 줄을 한 번씩 그린다", async () => {
    renderConversation(inquiry);
    expect(await screen.findByText(STARTED)).toBeInTheDocument();
    expect(screen.getByText(ENDED)).toBeInTheDocument();
    const order = screen
      .getAllByText(
        /안녕 광고주야|실시간 상담이 시작되었습니다|안녕하세요 광고주입니다|실시간 상담이 종료되었습니다/,
      )
      .map((element) => element.textContent);
    expect(order).toEqual([
      "안녕 광고주야",
      STARTED,
      "안녕하세요 광고주입니다",
      ENDED,
    ]);
  });

  it("종료 안내가 없는 진행 중 상담은 시작 줄만 그린다", async () => {
    firestore.data = {
      sequence: 1318,
      threadIdx: 501,
      matchRequestedAt: "2026-10-01 10:00:20",
      acceptedAt: "2026-10-01 10:00:46",
      messages: [
        consultationMessage("10:00:20", "실시간 상담을 요청했습니다.", "auto"),
        consultationMessage("10:00:46", "안녕하세요 광고주입니다", "responder"),
      ],
    };
    renderConversation(inquiry);
    expect(await screen.findByText(STARTED)).toBeInTheDocument();
    expect(screen.queryByText(ENDED)).not.toBeInTheDocument();
  });

  it("상담 문서가 없으면 줄 없이 REST 대화만 보인다", async () => {
    firestore.data = undefined;
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderConversation(inquiry);
    expect(
      await screen.findByText("안녕하세요 광고주입니다"),
    ).toBeInTheDocument();
    expect(screen.queryByText(STARTED)).not.toBeInTheDocument();
    expect(screen.queryByText(ENDED)).not.toBeInTheDocument();
  });

  it("구매자 문의 대화에는 줄을 넣지 않는다", async () => {
    renderConversation({
      ...inquiry,
      key: "purchaser-501",
      source: "purchaser",
    });
    expect(
      await screen.findByText("안녕하세요 광고주입니다"),
    ).toBeInTheDocument();
    expect(screen.queryByText(STARTED)).not.toBeInTheDocument();
    expect(screen.queryByText(ENDED)).not.toBeInTheDocument();
  });
});

describe("상대 메시지의 프로필 이미지", () => {
  const PROFILE = "https://img.test/profile.png";

  beforeEach(() => {
    // Radix Avatar는 이미지를 불러온 뒤에야 <img>를 그려서, jsdom에서는 이미 불러온 이미지로 처리함.
    vi.stubGlobal(
      "Image",
      class {
        complete = true;
        naturalWidth = 10;
        src = "";
        crossOrigin: string | null = null;
        referrerPolicy = "";
        addEventListener() {}
        removeEventListener() {}
      },
    );
    firestore.data = undefined;
    vi.spyOn(console, "error").mockImplementation(() => {});
    const thread = {
      result: true,
      data: [
        {
          threadIdx: 501,
          sequence: 1318,
          viewing: null,
          toUserIdx: 1,
          fmUserIdx: 77,
          campaignIdx: 10,
          finishTime: null,
          created: "2026-10-01T10:00:00",
          boardType: true,
          status: "WAITING",
          messages: [
            restMessage(1, "텍스트만", 77, "2026-10-01T10:00:00"),
            restMessage(2, "파일과 함께", 77, "2026-10-01T10:01:00"),
            {
              ...restMessage(
                3,
                "https://image.bigbird.co/sample.pptx",
                77,
                "2026-10-01T10:01:05",
              ),
              attachmentIdx: 9,
              fileName: "sample.pptx",
              fileSize: 1600,
            },
          ],
        },
      ],
    };
    vi.mocked(serverApiV3.get).mockImplementation(async (url: string) =>
      url.startsWith("/help/user/")
        ? {
            result: true,
            data: { nickname: null, id: null, profileImage: PROFILE },
          }
        : thread,
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it("텍스트만 보낸 메시지와 파일이 붙은 메시지 모두 같은 프로필 이미지를 쓴다", async () => {
    renderConversation(inquiry);
    expect(await screen.findByText("파일과 함께")).toBeInTheDocument();
    await waitFor(() =>
      expect(document.querySelectorAll(`img[src="${PROFILE}"]`)).toHaveLength(
        2,
      ),
    );
  });
});
