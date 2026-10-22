import {
  applyRealtimeConsultation,
  getConnectDeadline,
  getRealtimePhase,
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

  it("요청 뒤 5분 안에는 연결 대기, 5분이 지나면 요청 실패", () => {
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

  it("운영자가 연결하면 5분이 지나도 상담 중", () => {
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
    ).toMatchObject({ realtimePhase: "connected", status: "consulting" });
    expect(
      applyRealtimeConsultation(
        inquiry(),
        consultation(),
        start + REALTIME_CONNECT_TIMEOUT_MS,
      ),
    ).toMatchObject({ realtimePhase: "failed", status: "failed" });
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

  it("연결 뒤 3분 무응답 종료 시각을 계산하고, 광고주가 말하면 없앤다", () => {
    const connected = applyRealtimeConsultation(
      inquiry(),
      consultation({ isConnect: true, seqResponseDate: "2026-10-19 10:00:30" }),
      start + 1000,
    );
    expect(connected.idleDeadlineAt).toBe(start + 30_000 + 3 * 60_000);
    const talked = applyRealtimeConsultation(
      inquiry(),
      consultation({ isConnect: true, seqResponseDate: null }),
      start + 1000,
    );
    expect(talked.idleDeadlineAt).toBeNull();
  });
});

function formatForTest(time: number) {
  const d = new Date(time);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
