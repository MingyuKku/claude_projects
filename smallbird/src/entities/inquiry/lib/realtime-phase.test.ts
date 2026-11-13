import {
  applyRealtimeConsultation,
  getConnectDeadline,
  getRealtimePhase,
  isConsultationConnected,
  isConsultationCompletedShown,
  isMatchFailureShown,
  REALTIME_CONNECT_TIMEOUT_MS,
} from "./realtime-phase";

import type {
  BigbirdInquiryViewModel,
  RealtimeConsultation,
} from "../model/schema";

const requestedAt = new Date("2026-10-19T10:00:00");
const start = requestedAt.getTime();

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
    realtimePhase: null,
    createdAt: requestedAt,
    messages: [],
    ...overrides,
  };
}

function consultation(
  overrides: Partial<RealtimeConsultation> = {},
): RealtimeConsultation {
  return {
    sequence: 7,
    threadIdx: 101,
    isConnect: false,
    finishTime: null,
    messages: [],
    ...overrides,
  };
}

describe("getRealtimePhase", () => {
  const base = { isFinished: false, isConnect: false, requestedAt };

  it("요청 뒤 3분 안에는 연결 대기, 3분이 지나면 요청 실패", () => {
    expect(getRealtimePhase({ ...base, now: start })).toBe("requesting");
    expect(
      getRealtimePhase({
        ...base,
        now: start + REALTIME_CONNECT_TIMEOUT_MS - 1,
      }),
    ).toBe("requesting");
    expect(
      getRealtimePhase({ ...base, now: start + REALTIME_CONNECT_TIMEOUT_MS }),
    ).toBe("failed");
  });

  it("운영자가 연결하면 대기 시간이 지나도 상담 중", () => {
    expect(
      getRealtimePhase({
        ...base,
        isConnect: true,
        now: start + REALTIME_CONNECT_TIMEOUT_MS * 2,
      }),
    ).toBe("connected");
  });

  it("종료가 먼저다: 종료된 상담은 isConnect 값과 무관하게 완료", () => {
    for (const isConnect of [true, false]) {
      expect(
        getRealtimePhase({ ...base, isFinished: true, isConnect, now: start }),
      ).toBe("finished");
    }
  });
});

describe("applyRealtimeConsultation", () => {
  it("일반 문의는 그대로 둔다", () => {
    const board = inquiry({ isRealtime: false });
    expect(applyRealtimeConsultation(board, consultation(), start)).toBe(board);
  });

  it("상담 문서를 아직 모르면 상태를 추측하지 않는다", () => {
    const open = inquiry();
    expect(applyRealtimeConsultation(open, undefined, start)).toBe(open);
  });

  it("연결 상태에 따라 표시 상태와 단계를 정한다", () => {
    expect(
      applyRealtimeConsultation(inquiry(), consultation(), start),
    ).toMatchObject({ realtimePhase: "requesting", status: "waiting" });
    expect(
      applyRealtimeConsultation(
        inquiry(),
        consultation({ isConnect: true }),
        start,
      ),
    ).toMatchObject({ realtimePhase: "requesting", status: "waiting" });
    // 연결은 isConnect가 아니라 요청 뒤 계정 문서의 msgResponseDate로 판단함
    expect(
      applyRealtimeConsultation(inquiry(), consultation(), start, start + 10),
    ).toMatchObject({ realtimePhase: "connected", status: "consulting" });
    // 요청 전의 응답 시각(지난 상담 값)은 연결로 보지 않음
    expect(
      applyRealtimeConsultation(inquiry(), consultation(), start, start - 10),
    ).toMatchObject({ realtimePhase: "requesting" });
    // 상담 문서의 acceptedAt이 요청 시각 이후면 연결(계정 문서 값보다 먼저 봄)
    expect(
      applyRealtimeConsultation(
        inquiry(),
        consultation({
          matchRequestedAt: "2026-10-19 10:00:00",
          acceptedAt: "2026-10-19 10:00:05",
        }),
        start + 10_000,
        null,
      ),
    ).toMatchObject({ realtimePhase: "connected" });
    // 재요청으로 요청 시각이 새로 찍히면 예전 acceptedAt은 미연결. 계정 문서 값이 더 늦어도 acceptedAt이 우선
    expect(
      applyRealtimeConsultation(
        inquiry(),
        consultation({
          matchRequestedAt: "2026-10-19 10:01:00",
          acceptedAt: "2026-10-19 10:00:05",
        }),
        start + 70_000,
        start + 65_000,
      ),
    ).toMatchObject({ realtimePhase: "requesting" });
    // 서버가 쓴 요청 시각(matchRequestedAt)이 기준
    expect(
      applyRealtimeConsultation(
        inquiry(),
        consultation({ matchRequestedAt: "2026-10-19 10:01:00" }),
        start + 70_000,
        start + 30_000,
      ),
    ).toMatchObject({ realtimePhase: "requesting" });
    expect(
      applyRealtimeConsultation(
        inquiry(),
        consultation(),
        start + REALTIME_CONNECT_TIMEOUT_MS,
      ),
    ).toMatchObject({ realtimePhase: "failed", status: "waiting" });
  });

  it("Firestore에서 종료되면 REST가 아직 열려 있어도 완료로 본다", () => {
    expect(
      applyRealtimeConsultation(
        inquiry(),
        consultation({ finishTime: "2026-10-19 10:03:00" }),
        start,
      ),
    ).toMatchObject({
      realtimePhase: "finished",
      status: "done",
      isFinished: true,
    });
  });

  it("REST로 종료된 이력은 상담 문서 없이도 완료", () => {
    expect(
      applyRealtimeConsultation(
        inquiry({ isFinished: true, status: "done" }),
        undefined,
        start,
      ),
    ).toMatchObject({ realtimePhase: "finished", status: "done" });
  });
});

describe("getConnectDeadline", () => {
  it("연결 대기 중에만 마감 시각이 있다", () => {
    expect(
      getConnectDeadline({
        realtimePhase: "requesting",
        createdAt: requestedAt,
      }),
    ).toBe(start + REALTIME_CONNECT_TIMEOUT_MS);
    expect(
      getConnectDeadline({
        realtimePhase: "connected",
        createdAt: requestedAt,
      }),
    ).toBeNull();
  });
});

describe("applyRealtimeConsultation: 재시도·취소·무응답", () => {
  it("재시도로 새로 쓴 마감을 REST 생성 시각보다 우선한다", () => {
    const later = new Date(start + 10 * 60_000);
    const retried = consultation({
      waitDeadline: formatForTest(
        later.getTime() + REALTIME_CONNECT_TIMEOUT_MS,
      ),
    });
    const applied = applyRealtimeConsultation(
      inquiry(),
      retried,
      later.getTime() + 1000,
    );
    expect(applied.realtimePhase).toBe("requesting");
  });

  it("취소·만료가 기록되면 마감 전에도 실패이고, 취소는 재시도할 수 없다", () => {
    const expired = applyRealtimeConsultation(
      inquiry(),
      consultation({ expiredAt: "2026-10-19 10:01:00" }),
      start + 1000,
    );
    expect(expired).toMatchObject({
      realtimePhase: "failed",
      isRetryable: true,
    });
    const canceled = applyRealtimeConsultation(
      inquiry(),
      consultation({ canceledAt: "2026-10-19 10:01:00" }),
      start + 1000,
    );
    expect(canceled).toMatchObject({
      realtimePhase: "failed",
      isRetryable: false,
    });
  });

  it("이전 사이클의 취소·만료·수락 값이 남은 재요청은 요청 중으로 본다", () => {
    const reused = applyRealtimeConsultation(
      inquiry(),
      consultation({
        matchRequestedAt: "2026-10-19 10:00:30",
        canceledAt: "2026-10-19 09:50:00",
        expiredAt: "2026-10-19 09:55:00",
        acceptedAt: "2026-10-19 09:52:00",
        endReason: "MATCH_TIMEOUT",
      }),
      start + 31_000,
    );
    expect(reused.realtimePhase).toBe("requesting");
  });

  it("연결 뒤에는 마지막 메시지로 누구의 답을 기다리는지 정한다", () => {
    const connected = applyRealtimeConsultation(
      inquiry(),
      consultation({ isConnect: true, seqResponseDate: "2026-10-19 10:00:30" }),
      start + 1000,
      start + 500,
    );
    expect(connected.idleTurn).toEqual({
      waitingFor: "advertiser",
      since: start + 30_000,
    });
    const card = {
      auto: true,
      attachmentIdx: null,
      identifier: null,
      isUserMessage: false,
      body: '{"campaignIdx":1}',
      created: "2026-10-19 10:00:00",
    };
    const advertiserSpoke = applyRealtimeConsultation(
      inquiry(),
      consultation({
        isConnect: true,
        seqResponseDate: null,
        messages: [
          card,
          {
            ...card,
            auto: true,
            body: "상담원과 연결되었습니다.",
            created: "2026-10-19 10:00:30",
          },
          {
            ...card,
            auto: false,
            isUserMessage: true,
            body: "질문",
            created: "2026-10-19 10:01:00",
          },
        ],
      }),
      start + 1000,
      start + 500,
    );
    expect(advertiserSpoke.idleTurn).toEqual({
      waitingFor: "operator",
      since: start + 60_000,
    });
    const requesting = applyRealtimeConsultation(
      inquiry(),
      consultation({ isConnect: false }),
      start + 1000,
    );
    expect(requesting.idleTurn).toBeNull();
  });
});

function formatForTest(time: number) {
  const d = new Date(time);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

describe("isConsultationConnected", () => {
  const requestedAt = "2026-11-04 10:00:00";
  const acceptedAt = "2026-11-04 10:01:00";

  it("수락 시각이 요청 시각과 같거나 늦으면 연결됨", () => {
    expect(
      isConsultationConnected({ acceptedAt, matchRequestedAt: requestedAt }),
    ).toBe(true);
    expect(
      isConsultationConnected({
        acceptedAt: requestedAt,
        matchRequestedAt: requestedAt,
      }),
    ).toBe(true);
  });

  it("수락 시각이 요청 시각보다 이르면 연결 아님", () => {
    expect(
      isConsultationConnected({
        acceptedAt: "2026-11-04 09:00:00",
        matchRequestedAt: requestedAt,
      }),
    ).toBe(false);
  });

  it("수락이 없으면 연결 아님", () => {
    expect(isConsultationConnected({ matchRequestedAt: requestedAt })).toBe(
      false,
    );
  });

  it("서버가 일반 문의로 돌린 문서(요청 시각 비고 수락 시각 남음)는 연결 아님", () => {
    expect(
      isConsultationConnected({ acceptedAt, matchRequestedAt: null }),
    ).toBe(false);
  });

  it("같은 문서로 재요청해 다시 수락되면 이전 endReason이 남아도 연결됨", () => {
    const document = {
      acceptedAt: "2026-11-04 10:11:00",
      matchRequestedAt: "2026-11-04 10:10:00",
      endReason: "MATCH_TIMEOUT",
    };
    expect(isConsultationConnected(document)).toBe(true);
  });
});

describe("isMatchFailureShown", () => {
  const message = (
    overrides: Partial<RealtimeConsultation["messages"][number]>,
  ): RealtimeConsultation["messages"][number] => ({
    auto: false,
    attachmentIdx: null,
    identifier: null,
    isUserMessage: false,
    body: "내용",
    created: "2026-11-04 10:05:00",
    ...overrides,
  });
  const failed = consultation({
    endReason: "MATCH_TIMEOUT",
    matchRequestedAt: null,
    waitDeadline: "2026-11-04 10:03:00",
    messages: [
      message({ auto: true, body: "안내", created: "2026-11-04 10:03:01" }),
    ],
  });

  it("MATCH_TIMEOUT이고 요청 시각이 비면 보인다", () => {
    expect(isMatchFailureShown(failed)).toBe(true);
  });

  it("새 요청(요청 시각 있음)이거나 다른 종료 사유면 보이지 않는다", () => {
    expect(
      isMatchFailureShown({
        ...failed,
        matchRequestedAt: "2026-11-04 10:10:00",
      }),
    ).toBe(false);
    expect(
      isMatchFailureShown({ ...failed, endReason: "INACTIVITY_TIMEOUT" }),
    ).toBe(false);
    expect(isMatchFailureShown(undefined)).toBe(false);
  });

  it("실패 시각 뒤에 상담원이 보낸 일반 메시지가 오면 걷는다", () => {
    expect(
      isMatchFailureShown({
        ...failed,
        messages: [
          ...failed.messages,
          message({ created: "2026-11-04 10:05:00" }),
        ],
      }),
    ).toBe(false);
  });

  it("서버 자동 안내·광고주 메시지·실패 전 메시지는 답변으로 치지 않는다", () => {
    expect(
      isMatchFailureShown({
        ...failed,
        messages: [
          message({ auto: true, created: "2026-11-04 10:06:00" }),
          message({ isUserMessage: true, created: "2026-11-04 10:06:00" }),
          message({ created: "2026-11-04 10:02:00" }),
        ],
      }),
    ).toBe(true);
  });

  it("실패 시각 뒤에 광고주가 보낸 일반 문의가 있으면 걷는다", () => {
    const sent = (createdAt: string, overrides = {}) => ({
      isMine: true,
      campaign: null,
      createdAt: new Date(createdAt),
      ...overrides,
    });
    expect(isMatchFailureShown(failed, [sent("2026-11-04T10:04:00")])).toBe(
      false,
    );
    // 실패 전 메시지, 캠페인 카드, 상대(운영) 메시지는 일반 문의로 치지 않는다.
    expect(
      isMatchFailureShown(failed, [
        sent("2026-11-04T10:02:00"),
        sent("2026-11-04T10:04:00", { campaign: {} }),
        sent("2026-11-04T10:04:00", { isMine: false }),
      ]),
    ).toBe(true);
  });

  it("마감 시각이 없으면 마지막 자동 안내 시각을 기준으로 한다", () => {
    const withoutDeadline = { ...failed, waitDeadline: null };
    expect(isMatchFailureShown(withoutDeadline)).toBe(true);
    expect(
      isMatchFailureShown({
        ...withoutDeadline,
        messages: [
          ...withoutDeadline.messages,
          message({ created: "2026-11-04 10:05:00" }),
        ],
      }),
    ).toBe(false);
  });
});

describe("isConsultationCompletedShown", () => {
  it("운영·광고주가 직접 종료한 상담은 종료 안내 메시지가 없어도 보인다", () => {
    expect(
      isConsultationCompletedShown({ endReason: "RESPONDER_FINISHED" }, true),
    ).toBe(true);
    expect(
      isConsultationCompletedShown({ endReason: "REQUESTER_FINISHED" }, true),
    ).toBe(true);
  });

  it("시간 초과(연결 대기 3분·무응답)로 끝난 상담은 정상 종료로 보지 않는다", () => {
    expect(
      isConsultationCompletedShown({ endReason: "MATCH_TIMEOUT" }, true),
    ).toBe(false);
    expect(
      isConsultationCompletedShown({ endReason: "INACTIVITY_TIMEOUT" }, true),
    ).toBe(false);
  });

  it("스레드가 아직 열려 있거나 종료 사유·문서가 없으면 보이지 않는다", () => {
    expect(
      isConsultationCompletedShown({ endReason: "RESPONDER_FINISHED" }, false),
    ).toBe(false);
    expect(isConsultationCompletedShown({ endReason: null }, true)).toBe(false);
    expect(isConsultationCompletedShown(undefined, true)).toBe(false);
  });
});
