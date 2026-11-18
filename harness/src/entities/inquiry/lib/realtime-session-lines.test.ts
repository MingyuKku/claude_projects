import {
  deriveRealtimeLines,
  insertRealtimeLines,
} from "./realtime-session-lines";

import type {
  InquiryMessageViewModel,
  RealtimeConsultation,
} from "../model/schema";

const REQUEST = "실시간 상담을 요청했습니다.";
const END = "상담이 종료되었습니다.";

const at = (time: string) => new Date(`2026-11-06T${time}`).getTime();

// 상담 문서의 메시지. 요청자(인플루언서)는 isUserMessage true, 응답자(광고주)는 false.
function doc(
  messages: [
    created: string,
    body: string,
    kind: "auto" | "requester" | "responder",
    mode?: "general" | "realtime",
  ][],
  fields: Partial<RealtimeConsultation> = {},
): RealtimeConsultation {
  return {
    ...fields,
    messages: messages.map(([created, body, kind, mode]) => ({
      auto: kind === "auto",
      attachmentIdx: null,
      identifier: null,
      isUserMessage: kind === "auto" ? false : kind === "requester",
      body,
      created: `2026-11-06 ${created}`,
      ...(mode ? { mode } : {}),
    })),
  };
}

describe("deriveRealtimeLines", () => {
  it("한 문서에 상담이 여러 번 쌓여도 상담마다 시작·종료를 한 번씩, 자기 시각에 둔다", () => {
    // stage 2145 문서와 같은 흐름: 첫 상담(요청→응답→종료) 뒤 재요청이 수락돼 진행 중.
    const lines = deriveRealtimeLines(
      doc(
        [
          ["16:51:25", "안녕 광고주야", "requester"],
          ["16:52:01", REQUEST, "auto"],
          ["16:52:46", "안녕 난 광고주", "responder"],
          ["16:54:16", END, "auto"],
          ["16:54:38", REQUEST, "auto"],
          ["16:55:44", "안녕", "responder"],
        ],
        {
          matchRequestedAt: "2026-11-06 16:54:38",
          acceptedAt: "2026-11-06 16:55:44",
        },
      ),
    );
    expect(lines).toEqual([
      { kind: "start", at: at("16:52:46") },
      { kind: "end", at: at("16:54:16") },
      { kind: "start", at: at("16:55:44") },
    ]);
  });

  it("종료 없이 진행 중이면 시작만 있다(마지막 상담은 문서의 수락 시각)", () => {
    const lines = deriveRealtimeLines(
      doc([["16:54:38", REQUEST, "auto"]], {
        matchRequestedAt: "2026-11-06 16:54:38",
        acceptedAt: "2026-11-06 16:55:00",
      }),
    );
    expect(lines).toEqual([{ kind: "start", at: at("16:55:00") }]);
  });

  it("수락이 첫 응답보다 빠르면 수락 시각을 시작으로 쓴다", () => {
    const lines = deriveRealtimeLines(
      doc(
        [
          ["16:54:38", REQUEST, "auto"],
          ["16:55:30", "안녕", "responder"],
        ],
        {
          matchRequestedAt: "2026-11-06 16:54:38",
          acceptedAt: "2026-11-06 16:55:00",
        },
      ),
    );
    expect(lines).toEqual([{ kind: "start", at: at("16:55:00") }]);
  });

  it("일반 문의(mode general)로 쓴 답장은 끝나지 않고 남은 요청 뒤에 와도 연결로 보지 않는다", () => {
    const lines = deriveRealtimeLines(
      doc([
        ["16:52:01", REQUEST, "auto"],
        ["16:55:44", "일반 문의 답장", "responder", "general"],
      ]),
    );
    expect(lines).toEqual([]);
    // 같은 자리에서 실제 실시간(realtime)으로 쓴 답장이면 시작 줄이 생긴다.
    expect(
      deriveRealtimeLines(
        doc([
          ["16:52:01", REQUEST, "auto"],
          ["16:55:44", "실시간 답장", "responder", "realtime"],
        ]),
      ),
    ).toEqual([{ kind: "start", at: at("16:55:44") }]);
  });

  it("연결되지 않은 상담(응답 없이 종료)은 시작도 종료도 그리지 않는다", () => {
    const lines = deriveRealtimeLines(
      doc([
        ["16:52:01", REQUEST, "auto"],
        [
          "16:55:01",
          "추가 문의가 없으셔서 실시간 상담이 자동종료되었습니다.",
          "auto",
        ],
      ]),
    );
    expect(lines).toEqual([]);
  });

  it("아직 수락 전인 재요청은 이전 상담 줄만 남기고 새 시작 줄은 없다", () => {
    const lines = deriveRealtimeLines(
      doc(
        [
          ["16:52:01", REQUEST, "auto"],
          ["16:52:46", "안녕", "responder"],
          ["16:54:16", END, "auto"],
          ["16:54:38", REQUEST, "auto"],
        ],
        {
          matchRequestedAt: "2026-11-06 16:54:38",
          // 수락 시각은 이전 상담의 값(요청보다 이르다)
          acceptedAt: "2026-11-06 16:52:46",
        },
      ),
    );
    expect(lines).toEqual([
      { kind: "start", at: at("16:52:46") },
      { kind: "end", at: at("16:54:16") },
    ]);
  });

  it.each([
    ["광고주가 끝낸 경우(앱이 남기는 문구)", "실시간 상담이 종료되었습니다."],
    ["인플루언서·서버가 끝낸 경우", END],
  ])("%s 종료 안내가 와도 종료 줄은 한 번이다", (_, body) => {
    const lines = deriveRealtimeLines(
      doc([
        ["16:52:01", REQUEST, "auto"],
        ["16:52:46", "안녕", "responder"],
        ["16:54:16", body, "auto"],
        ["16:54:16", END, "auto"],
        ["16:54:17", body, "auto"],
      ]),
    );
    expect(lines.filter((line) => line.kind === "end")).toEqual([
      { kind: "end", at: at("16:54:16") },
    ]);
  });

  it("요청 안내가 없는 옛 문서는 상담을 나눌 수 없어 줄이 없다", () => {
    const lines = deriveRealtimeLines(
      doc([["16:52:46", "안녕", "responder"]], {
        matchRequestedAt: "2026-11-06 16:52:00",
        acceptedAt: "2026-11-06 16:52:46",
      }),
    );
    expect(lines).toEqual([]);
  });
});

function message(
  id: number,
  createdAt: string,
  body: string,
  kind: InquiryMessageViewModel["kind"] = "text",
): InquiryMessageViewModel {
  return {
    id,
    isMine: false,
    kind,
    body,
    createdAt: new Date(`2026-11-06T${createdAt}`),
    isDeleted: false,
    isRead: false,
    isEdited: false,
    senderId: null,
    campaign: null,
    attachment: null,
  };
}

const labels = { start: "시작", end: "종료" };

describe("insertRealtimeLines", () => {
  it("줄이 없으면 메시지를 그대로 돌려준다", () => {
    const messages = [message(1, "16:51:25", "a")];
    expect(insertRealtimeLines(messages, [], labels)).toBe(messages);
  });

  it("시작 줄은 같은 초의 첫 메시지 앞에, 종료 줄은 같은 초의 마지막 메시지 뒤에 둔다", () => {
    const result = insertRealtimeLines(
      [
        message(1, "16:51:25", "요청 전"),
        message(2, "16:55:44", "첫 응답"),
        message(3, "16:56:10", "대화"),
        message(4, "16:57:00", "끝 직전"),
        message(5, "16:58:00", "종료 뒤"),
      ],
      [
        { kind: "start", at: at("16:55:44") },
        { kind: "end", at: at("16:57:00") },
      ],
      labels,
    );
    expect(result.map((item) => item.body)).toEqual([
      "요청 전",
      "시작",
      "첫 응답",
      "대화",
      "끝 직전",
      "종료",
      "종료 뒤",
    ]);
    expect(result.filter((item) => item.kind === "notice")).toHaveLength(2);
  });

  it("REST에 같은 시각의 종료 안내가 있으면 중복이라 빼고, 다른 시각의 안내는 남긴다", () => {
    const result = insertRealtimeLines(
      [
        message(1, "16:52:46", "응답"),
        message(2, "16:54:16", END, "notice"),
        message(3, "17:10:00", END, "notice"),
      ],
      [
        { kind: "start", at: at("16:52:46") },
        { kind: "end", at: at("16:54:17") },
      ],
      labels,
    );
    expect(result.map((item) => item.body)).toEqual([
      "시작",
      "응답",
      "종료",
      END,
    ]);
  });

  it("메시지보다 앞서거나 뒤인 줄도 맨 앞·맨 뒤에 놓인다", () => {
    const result = insertRealtimeLines(
      [message(1, "16:55:00", "가운데")],
      [
        { kind: "start", at: at("16:50:00") },
        { kind: "end", at: at("17:00:00") },
      ],
      labels,
    );
    expect(result.map((item) => item.body)).toEqual(["시작", "가운데", "종료"]);
  });
});
