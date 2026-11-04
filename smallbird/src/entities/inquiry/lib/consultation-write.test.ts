import { describe, expect, it } from "vitest";

import {
  LOCK_TTL_MS,
  formatWriteTime,
  getWaitDeadline,
  planAbortClose,
  planAcceptRequest,
  planAcquireLock,
  planAppendMessage,
  planBeginClose,
  planCancelRequest,
  planCreateRequest,
  planFinishClose,
  planMarkExpired,
  planReleaseLock,
  planRetryRequest,
} from "./consultation-write";

import type { AppendInput, ConsultationDoc } from "./consultation-write";

const NOW = new Date("2026-10-19T10:00:00").getTime();
const stamp = (offsetMs: number) => formatWriteTime(NOW + offsetMs);

function doc(overrides: Partial<ConsultationDoc> = {}): ConsultationDoc {
  return {
    sequence: 7,
    threadIdx: 101,
    isConnect: true,
    finishTime: null,
    messages: [],
    ...overrides,
  };
}

function input(overrides: Partial<AppendInput> = {}): AppendInput {
  return {
    expected: { sequence: 7, threadIdx: 101 },
    message: {
      auto: false,
      attachmentIdx: null,
      identifier: "me",
      isUserMessage: true,
      body: "안녕하세요",
      fileName: null,
      messageId: "m1",
    },
    requireConnected: true,
    now: NOW,
    ...overrides,
  };
}

const lockA = { owner: "1_1", tabId: "tab-a" };
const lockA2 = { owner: "1_1", tabId: "tab-a2" };
const lockB = { owner: "2_9", tabId: "tab-b" };

describe("planAppendMessage", () => {
  it("읽은 최신 배열 끝에 붙이고 광고주 메시지는 무응답 타이머를 멈춘다", () => {
    const existing = {
      auto: false,
      attachmentIdx: null,
      identifier: "op",
      isUserMessage: false,
      body: "운영자가 먼저 보낸 메시지",
      fileName: null,
      created: "x",
      messageId: "op1",
    };
    const plan = planAppendMessage(
      doc({ messages: [existing] }),
      undefined,
      input(),
    );
    expect(plan).toMatchObject({
      kind: "write",
      consultation: { seqResponseDate: null },
      account: { newSenderUserIdx: 1, threadBoardType: 0 },
    });
    if (plan.kind !== "write") throw new Error();
    const messages = plan.consultation?.messages as { messageId: string }[];
    expect(messages.map((m) => m.messageId)).toEqual(["op1", "m1"]);
  });

  it("배열로 주면 한 번의 쓰기로 모두 붙이고, 하나라도 이미 있으면 전부 건너뛴다", () => {
    const base = input().message as Exclude<
      ReturnType<typeof input>["message"],
      unknown[]
    >;
    const batch = ["f1", "f2", "f3"].map((id) => ({ ...base, messageId: id }));
    const plan = planAppendMessage(doc(), undefined, input({ message: batch }));
    if (plan.kind !== "write") throw new Error();
    const messages = plan.consultation?.messages as {
      messageId: string;
      created: string;
    }[];
    expect(messages.map((m) => m.messageId)).toEqual(["f1", "f2", "f3"]);
    // 한 번에 쓰므로 같은 시각으로 저장됨.
    expect(new Set(messages.map((m) => m.created)).size).toBe(1);
    expect(
      planAppendMessage(
        doc({ messages: messages as ConsultationDoc["messages"] }),
        undefined,
        input({ message: batch }),
      ),
    ).toEqual({ kind: "skip" });
  });

  it("같은 messageId는 다시 붙이지 않는다(재시도)", () => {
    const first = planAppendMessage(doc(), undefined, input());
    if (first.kind !== "write") throw new Error();
    const saved = first.consultation?.messages as ConsultationDoc["messages"];
    expect(
      planAppendMessage(doc({ messages: saved }), undefined, input()),
    ).toEqual({ kind: "skip" });
  });

  it.each([
    ["finishTime", { finishTime: "t" }, "finished"],
    ["closingAt", { closingAt: "t" }, "closing"],
    ["canceledAt", { canceledAt: "t" }, "canceled"],
    ["expiredAt", { expiredAt: "t" }, "expired"],
  ] as const)("%s가 있으면 거절한다", (_name, patch, reason) => {
    expect(planAppendMessage(doc(patch), undefined, input())).toEqual({
      kind: "reject",
      reason,
    });
  });

  it("문서가 없거나 다른 상담이면 쓰지 않는다", () => {
    expect(planAppendMessage(undefined, undefined, input())).toEqual({
      kind: "reject",
      reason: "missing",
    });
    expect(
      planAppendMessage(doc({ threadIdx: 999 }), undefined, input()),
    ).toEqual({ kind: "reject", reason: "mismatch" });
  });

  it("연결 전에는 본문을 거절하고 자동 안내는 허용한다", () => {
    const waiting = doc({ isConnect: false });
    expect(planAppendMessage(waiting, undefined, input())).toEqual({
      kind: "reject",
      reason: "not-connected",
    });
    expect(
      planAppendMessage(waiting, undefined, input({ requireConnected: false }))
        .kind,
    ).toBe("write");
  });

  it("연결 전 미리 보낸 메시지는 마감 전까지만 받는다", () => {
    const waiting = doc({
      isConnect: false,
      created: stamp(-60_000),
      origin: "v3",
    });
    const early = input({ requireConnected: false });
    expect(planAppendMessage(waiting, undefined, early).kind).toBe("write");
    const late = doc({ isConnect: false, created: stamp(-6 * 60_000) });
    expect(planAppendMessage(late, undefined, early)).toEqual({
      kind: "reject",
      reason: "expired",
    });
  });

  it("락이 필요하면 내 탭이 유효할 때만 쓴다", () => {
    const held = {
      clientResponseUserIdx: lockA.owner,
      clientResponseTabs: { [lockA.tabId]: NOW + 1000 },
    };
    expect(planAppendMessage(doc(), held, input({ lock: lockA })).kind).toBe(
      "write",
    );
    expect(planAppendMessage(doc(), held, input({ lock: lockB }))).toEqual({
      kind: "reject",
      reason: "lock-lost",
    });
    const expired = { ...held, clientResponseTabs: { [lockA.tabId]: NOW - 1 } };
    expect(planAppendMessage(doc(), expired, input({ lock: lockA }))).toEqual({
      kind: "reject",
      reason: "lock-lost",
    });
  });
});

describe("요청 취소·만료", () => {
  it("대기 중이면 취소하고, 같은 취소는 건너뛰고, 연결·종료 뒤에는 거절한다", () => {
    expect(planCancelRequest(doc({ isConnect: false }), NOW)).toEqual({
      kind: "write",
      consultation: { canceledAt: stamp(0) },
    });
    expect(planCancelRequest(doc({ canceledAt: "t" }), NOW)).toEqual({
      kind: "skip",
    });
    expect(planCancelRequest(doc(), NOW)).toEqual({
      kind: "reject",
      reason: "connected",
    });
    expect(
      planCancelRequest(doc({ isConnect: false, finishTime: "t" }), NOW),
    ).toEqual({
      kind: "reject",
      reason: "finished",
    });
  });

  it("마감 필드가 없으면 요청 시각 + 3분으로 만료를 판단한다", () => {
    const waiting = doc({
      isConnect: false,
      created: stamp(0),
      origin: "v3",
    });
    expect(getWaitDeadline(waiting)).toBe(NOW + 3 * 60_000);
    expect(planMarkExpired(waiting, NOW + 3 * 60_000 - 1000)).toEqual({
      kind: "skip",
    });
    expect(planMarkExpired(waiting, NOW + 3 * 60_000)).toMatchObject({
      kind: "write",
      consultation: { expiredAt: stamp(3 * 60_000) },
    });
    expect(
      planMarkExpired(
        doc({ isConnect: true, created: stamp(0) }),
        NOW + 10 * 60_000,
      ),
    ).toEqual({
      kind: "skip",
    });
  });

  it("일반 문의로 다시 열린 문서는 옛 마감이 남아 있어도 만료로 기록하지 않는다", () => {
    const reopened = doc({
      boardType: true,
      isConnect: false,
      origin: "v3",
      waitDeadline: stamp(0),
    });
    expect(planMarkExpired(reopened, NOW + 60 * 60_000)).toEqual({
      kind: "skip",
    });
  });
});

describe("종료", () => {
  it("종료 시작은 한 번만 쓰고, 시작 뒤에는 전송이 막힌다", () => {
    const begun = planBeginClose(doc(), NOW);
    expect(begun).toEqual({
      kind: "write",
      consultation: { closingAt: stamp(0) },
    });
    expect(planBeginClose(doc({ closingAt: "t" }), NOW)).toEqual({
      kind: "skip",
    });
    expect(planBeginClose(doc({ finishTime: "t" }), NOW)).toEqual({
      kind: "skip",
    });
    expect(planBeginClose(doc({ canceledAt: "t" }), NOW).kind).toBe("write");
  });

  it("종료 확정은 종료 메시지를 한 번만 붙이고 finishTime이 있으면 건너뛴다", () => {
    const closing = doc({ closingAt: "t" });
    const plan = planFinishClose(closing, {
      closeMessageId: "close:7",
      now: NOW,
    });
    if (plan.kind !== "write") throw new Error();
    expect(plan.consultation).toMatchObject({
      finishTime: stamp(0),
      isConnect: true,
    });
    const saved = plan.consultation?.messages as ConsultationDoc["messages"];
    expect(saved).toHaveLength(1);
    // 메시지만 저장되고 finishTime 쓰기가 되풀이되는 경우에도 종료 메시지가 중복되지 않는다.
    const retry = planFinishClose(doc({ closingAt: "t", messages: saved }), {
      closeMessageId: "close:7",
      now: NOW,
    });
    expect(retry).toMatchObject({ kind: "write" });
    if (retry.kind === "write")
      expect(retry.consultation).not.toHaveProperty("messages");
    expect(
      planFinishClose(doc({ finishTime: "t" }), {
        closeMessageId: "close:7",
        now: NOW,
      }),
    ).toEqual({ kind: "skip" });
  });

  it("종료 표시는 아직 끝나지 않았을 때만 거둔다", () => {
    expect(planAbortClose(doc({ closingAt: "t" }))).toEqual({
      kind: "write",
      consultation: { closingAt: null },
    });
    expect(planAbortClose(doc({ closingAt: "t", finishTime: "t" }))).toEqual({
      kind: "skip",
    });
  });
});

describe("락", () => {
  it("비어 있으면 얻고, 내 탭은 만료를 연장한다", () => {
    const first = planAcquireLock(undefined, lockA, 7, NOW);
    if (first.kind !== "write") throw new Error();
    expect(first.account).toMatchObject({
      clientResponseUserIdx: "1_1",
      clientResponseSequence: 7,
      clientResponseTabs: { "tab-a": NOW + LOCK_TTL_MS },
    });
    const again = planAcquireLock(first.account as never, lockA, 7, NOW + 1000);
    expect(again).toMatchObject({
      kind: "write",
      account: { clientResponseTabs: { "tab-a": NOW + 1000 + LOCK_TTL_MS } },
    });
  });

  it("같은 계정의 다른 탭이 살아 있으면 거절하고, 만료되면 들어온다", () => {
    const held = {
      clientResponseUserIdx: "1_1",
      clientResponseTabs: { "tab-a": NOW + 1000 },
    };
    expect(planAcquireLock(held, lockA2, 7, NOW)).toEqual({
      kind: "reject",
      reason: "lock-lost",
    });
    expect(planAcquireLock(held, lockA2, 7, NOW + 2000).kind).toBe("write");
  });

  it("다른 계정은 살아 있는 락을 가져가지 못하고, 모두 만료되면 가져간다", () => {
    const held = {
      clientResponseUserIdx: "1_1",
      clientResponseTabs: { "tab-a": NOW + 1000 },
    };
    expect(planAcquireLock(held, lockB, 7, NOW)).toEqual({
      kind: "reject",
      reason: "lock-lost",
    });
    const taken = planAcquireLock(held, lockB, 7, NOW + 2000);
    expect(taken).toMatchObject({
      kind: "write",
      account: {
        clientResponseUserIdx: "2_9",
        clientResponseTabs: { "tab-b": NOW + 2000 + LOCK_TTL_MS },
      },
    });
  });

  it("탭 목록이 없는 v2 락은 소유자가 놓을 때까지 유효하다", () => {
    expect(
      planAcquireLock({ clientResponseUserIdx: "1_1" }, lockB, 7, NOW),
    ).toEqual({
      kind: "reject",
      reason: "lock-lost",
    });
    expect(
      planAcquireLock({ clientResponseUserIdx: "1_1" }, lockA, 7, NOW).kind,
    ).toBe("write");
  });

  it("한 탭을 놓아도 다른 탭이 살아 있으면 락을 유지한다", () => {
    const held = {
      clientResponseUserIdx: "1_1",
      clientResponseTabs: { "tab-a": NOW + 5000, "tab-a2": NOW + 5000 },
    };
    expect(planReleaseLock(held, lockA, NOW)).toMatchObject({
      kind: "write",
      account: { clientResponseTabs: { "tab-a2": NOW + 5000 } },
    });
    const last = planReleaseLock(
      { ...held, clientResponseTabs: { "tab-a": NOW + 5000 } },
      lockA,
      NOW,
    );
    expect(last).toMatchObject({
      kind: "write",
      account: { clientResponseUserIdx: null, clientResponseTabs: {} },
    });
  });

  it("락 쓰기는 계정 문서 updated를 바꾸지 않는다", () => {
    // 운영 v3가 updated를 목록 재조회 신호로 쓰므로 15초 갱신마다 재조회가 일어나지 않게 함
    const held = {
      clientResponseUserIdx: "1_1",
      clientResponseTabs: { "tab-a": NOW + 5000, "tab-a2": NOW + 5000 },
    };
    const plans = [
      planAcquireLock(undefined, lockA, 7, NOW),
      planReleaseLock(held, lockA, NOW),
      planReleaseLock(
        { ...held, clientResponseTabs: { "tab-a": NOW + 5000 } },
        lockA,
        NOW,
      ),
    ];
    for (const plan of plans) {
      if (plan.kind !== "write") throw new Error();
      expect(plan.account).not.toHaveProperty("updated");
    }
  });

  it("늦은 해제가 새 소유자의 락을 지우지 않는다", () => {
    const held = {
      clientResponseUserIdx: "2_9",
      clientResponseTabs: { "tab-b": NOW + 5000 },
    };
    expect(planReleaseLock(held, lockA, NOW)).toEqual({ kind: "skip" });
  });
});

describe("planCreateRequest", () => {
  const base = {
    threadUserIdx: 5971,
    userIdx: 42,
    userId: "bigbird",
    sequence: 7,
    threadIdx: 101,
    campaign: null,
    firstMessage: null,
    now: NOW,
  };

  it("v3 요청으로 만들고 마감을 3분 뒤로 둔다", () => {
    const plan = planCreateRequest(undefined, {}, base);
    expect(plan?.consultation).toMatchObject({
      origin: "v3",
      isConnect: false,
      finishTime: null,
      waitDeadline: stamp(3 * 60_000),
    });
    expect(plan?.createAccount).toBe(false);
  });

  it("운영 앱이 v3 알림을 구분하도록 알림에 origin·threadIdx·sequence를 담는다", () => {
    const plan = planCreateRequest(undefined, {}, base);
    expect(plan?.account.alarmData).toMatchObject({
      id: "bigbird",
      callType: "client",
      threadUserIdx: 5971,
      userIdx: 42,
      campaignIdx: null,
      origin: "v3",
      threadIdx: 101,
      sequence: 7,
    });
  });

  it("기타 문의는 빈 대화로, 캠페인 문의는 카드 메시지 하나로 시작한다", () => {
    expect(
      planCreateRequest(undefined, {}, base)?.consultation.messages,
    ).toEqual([]);
    const withCard = planCreateRequest(
      undefined,
      {},
      {
        ...base,
        firstMessage: { id: "first", body: "{}" },
      },
    );
    expect(withCard?.consultation.messages).toMatchObject([
      { auto: true, isUserMessage: false, body: "{}", messageId: "first" },
    ]);
  });

  it("같은 sequence가 이미 있으면 다시 만들지 않는다", () => {
    expect(planCreateRequest(doc(), {}, base)).toBeNull();
  });

  it("열린 일반 문의 문서면 메시지는 두고 실시간 필드를 합친다", () => {
    const plan = planCreateRequest(
      doc({ boardType: true, finishTime: null }),
      {},
      base,
    );

    expect(plan?.isConversion).toBe(true);
    expect(plan?.consultation).toMatchObject({
      boardType: false,
      isConnect: false,
      finishTime: null,
      origin: "v3",
      sequence: 7,
      threadIdx: 101,
      waitDeadline: stamp(3 * 60_000),
    });
    expect(plan?.consultation).not.toHaveProperty("messages");
    // 전에 끝낸 실시간 상담의 종료 표시가 남아 있으면 새 요청이 종료 중으로 보이므로 지움
    expect(plan?.consultation).toMatchObject({
      closingAt: null,
      canceledAt: null,
      expiredAt: null,
    });
  });

  it("일반 문의 문서로 전환할 때 같은 캠페인 카드가 없을 때만 카드를 붙인다", () => {
    const card = JSON.stringify({ campaignIdx: 6329 });
    const withCampaign = {
      ...base,
      campaign: {
        campaignIdx: 6329,
        campaignCode: "C1",
        productName: "상품",
        mainImageUrl: null,
      },
      firstMessage: { id: "first", body: card },
    };
    const question = {
      auto: false,
      attachmentIdx: null,
      identifier: "bigbird",
      isUserMessage: true,
      body: "문의",
      fileName: null,
      created: "2026-10-29 10:00:00",
    };

    const added = planCreateRequest(
      doc({ boardType: true, messages: [question] }),
      {},
      withCampaign,
    );
    expect(added?.consultation.messages).toMatchObject([
      question,
      { auto: true, body: card, messageId: "first" },
    ]);

    const existingCard = {
      ...question,
      auto: true,
      isUserMessage: false,
      body: card,
    };
    const kept = planCreateRequest(
      doc({ boardType: true, messages: [existingCard, question] }),
      {},
      withCampaign,
    );
    expect(kept?.consultation).not.toHaveProperty("messages");
  });

  it("끝난 일반 문의 문서는 다시 요청으로 바꾸지 않는다", () => {
    expect(
      planCreateRequest(
        doc({ boardType: true, finishTime: "2026-10-28 11:52:26" }),
        {},
        base,
      ),
    ).toBeNull();
  });

  it("계정 문서가 없으면 새로 만들도록 알린다", () => {
    expect(planCreateRequest(undefined, undefined, base)?.createAccount).toBe(
      true,
    );
  });
});

describe("planRetryRequest", () => {
  const alarm = { id: "bigbird" };

  it("마감이 지났거나 만료된 요청만 새 마감으로 다시 요청한다", () => {
    const expired = doc({ isConnect: false, expiredAt: "t" });
    expect(planRetryRequest(expired, { alarm, now: NOW })).toMatchObject({
      kind: "write",
      consultation: {
        expiredAt: null,
        waitDeadline: stamp(3 * 60_000),
        seqResponseDate: stamp(0),
      },
      account: { alarmData: alarm, newSenderUserIdx: 1 },
    });
    const late = doc({ isConnect: false, created: stamp(-6 * 60_000) });
    expect(planRetryRequest(late, { alarm, now: NOW }).kind).toBe("write");
    // 아직 기다리는 중이면 건드리지 않는다.
    const waiting = doc({ isConnect: false, created: stamp(-60_000) });
    expect(planRetryRequest(waiting, { alarm, now: NOW })).toEqual({
      kind: "skip",
    });
  });

  it("연결·종료·취소된 요청은 다시 요청하지 않는다", () => {
    expect(planRetryRequest(doc(), { alarm, now: NOW })).toEqual({
      kind: "reject",
      reason: "connected",
    });
    expect(
      planRetryRequest(doc({ isConnect: false, canceledAt: "t" }), {
        alarm,
        now: NOW,
      }),
    ).toEqual({ kind: "reject", reason: "canceled" });
  });
});

describe("서버가 Timestamp로 쓴 시각", () => {
  const timestamp = (ms: number) => ({ toDate: () => new Date(ms) });

  it("대기 마감과 요청 시각이 Timestamp여도 마감을 계산한다", () => {
    const explicit = doc({
      isConnect: false,
      waitDeadline: timestamp(NOW + 60_000) as unknown as string,
    });
    expect(getWaitDeadline(explicit)).toBe(NOW + 60_000);

    const requested = doc({
      isConnect: false,
      created: timestamp(NOW) as unknown as string,
    });
    expect(getWaitDeadline(requested)).toBe(NOW + 3 * 60_000);
  });
});

describe("planAcceptRequest", () => {
  const accept = (consultation: ConsultationDoc | undefined) =>
    planAcceptRequest(
      consultation,
      { userIdx: 5546 },
      { identifier: "adv", now: NOW },
    );

  it("대기 중인 요청을 연결하고 자동 메시지와 계정 응대 상태를 씀", () => {
    expect(
      accept(doc({ isConnect: false, waitDeadline: stamp(60_000) })),
    ).toEqual({
      kind: "write",
      consultation: {
        isConnect: true,
        seqResponseDate: stamp(0),
        messages: [
          expect.objectContaining({
            auto: true,
            isUserMessage: false,
            identifier: "adv",
            created: stamp(0),
          }),
        ],
      },
      account: {
        alarmData: null,
        threadBoardType: 0,
        newSenderUserIdx: 5546,
        msgResponseDate: stamp(0),
        updated: stamp(0),
      },
    });
  });

  it("이미 연결됐으면 건너뛰고, 취소·만료·마감 지난 요청은 거절함", () => {
    expect(accept(doc())).toEqual({ kind: "skip" });
    expect(accept(doc({ isConnect: false, canceledAt: stamp(-1) }))).toEqual({
      kind: "reject",
      reason: "canceled",
    });
    expect(accept(doc({ isConnect: false, waitDeadline: stamp(0) }))).toEqual({
      kind: "reject",
      reason: "expired",
    });
    expect(accept(undefined)).toEqual({ kind: "reject", reason: "missing" });
  });
});

describe("서버가 Timestamp로 쓴 시각", () => {
  const timestamp = (ms: number) => ({ toDate: () => new Date(ms) });

  it("대기 마감과 요청 시각이 Timestamp여도 마감을 계산한다", () => {
    const explicit = doc({
      isConnect: false,
      waitDeadline: timestamp(NOW + 60_000) as unknown as string,
    });
    expect(getWaitDeadline(explicit)).toBe(NOW + 60_000);

    const requested = doc({
      isConnect: false,
      created: timestamp(NOW) as unknown as string,
    });
    expect(getWaitDeadline(requested)).toBe(NOW + 3 * 60_000);
  });
});
