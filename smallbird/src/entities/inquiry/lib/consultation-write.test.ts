import { describe, expect, it } from "vitest";

import {
  LOCK_TTL_MS,
  buildRequestAlarm,
  formatWriteTime,
  planAcquireLock,
  planReleaseLock,
} from "./consultation-write";

const NOW = new Date("2026-10-19T10:00:00").getTime();

const lockA = { owner: "1_1", tabId: "tab-a" };
const lockA2 = { owner: "1_1", tabId: "tab-a2" };
const lockB = { owner: "2_9", tabId: "tab-b" };

const tab = (owner: string, sequence: number, expiresAt: number) => ({
  owner,
  sequence,
  expiresAt,
});

describe("락(상담 건별)", () => {
  it("비어 있으면 얻고, 내 탭은 만료를 연장한다", () => {
    const first = planAcquireLock(undefined, lockA, 7, NOW);
    if (first.kind !== "write") throw new Error();
    expect(first.account).toMatchObject({
      clientResponseUserIdx: "1_1",
      clientResponseSequence: 7,
      clientResponseTabs: { "tab-a": tab("1_1", 7, NOW + LOCK_TTL_MS) },
    });
    const again = planAcquireLock(first.account as never, lockA, 7, NOW + 1000);
    expect(again).toMatchObject({
      kind: "write",
      account: {
        clientResponseTabs: {
          "tab-a": tab("1_1", 7, NOW + 1000 + LOCK_TTL_MS),
        },
      },
    });
  });

  it("같은 상담은 같은 계정의 다른 탭·다른 상담원이 살아 있으면 거절하고, 만료되면 들어온다", () => {
    const held = {
      clientResponseUserIdx: "1_1",
      clientResponseSequence: 7,
      clientResponseTabs: { "tab-a": tab("1_1", 7, NOW + 1000) },
    };
    for (const other of [lockA2, lockB])
      expect(planAcquireLock(held, other, 7, NOW)).toEqual({
        kind: "reject",
        reason: "lock-lost",
      });
    expect(planAcquireLock(held, lockB, 7, NOW + 2000).kind).toBe("write");
  });

  it("다른 상담은 막지 않고, 다른 상담의 탭 정보는 그대로 둔다", () => {
    const held = {
      clientResponseUserIdx: "1_1",
      clientResponseSequence: 7,
      clientResponseTabs: { "tab-a": tab("1_1", 7, NOW + 5000) },
    };
    const plan = planAcquireLock(held, lockB, 8, NOW);
    expect(plan).toMatchObject({
      kind: "write",
      account: {
        clientResponseUserIdx: "2_9",
        clientResponseSequence: 8,
        clientResponseTabs: {
          "tab-a": tab("1_1", 7, NOW + 5000),
          "tab-b": tab("2_9", 8, NOW + LOCK_TTL_MS),
        },
      },
    });
    // 같은 계정의 다른 탭도 다른 상담이면 들어감
    expect(planAcquireLock(held, lockA2, 8, NOW).kind).toBe("write");
  });

  it("v2 락(탭 목록 없음)은 그 상담만 다른 계정을 막고, 같은 계정은 통과한다", () => {
    const v2 = { clientResponseUserIdx: "1_1", clientResponseSequence: 7 };
    expect(planAcquireLock(v2, lockB, 7, NOW)).toEqual({
      kind: "reject",
      reason: "lock-lost",
    });
    expect(planAcquireLock(v2, lockA, 7, NOW).kind).toBe("write");
    // 다른 상담은 들어가되 v2 소유자 표시는 지우지 않음
    const other = planAcquireLock(v2, lockB, 8, NOW);
    if (other.kind !== "write") throw new Error();
    expect(other.account).not.toHaveProperty("clientResponseUserIdx");
    // 상담 번호 없는 v2 락은 모든 상담을 막음
    expect(
      planAcquireLock({ clientResponseUserIdx: "1_1" }, lockB, 8, NOW).kind,
    ).toBe("reject");
  });

  it("예전 숫자 형식 탭은 계정의 소유자·상담 번호로 읽는다", () => {
    const old = {
      clientResponseUserIdx: "1_1",
      clientResponseSequence: 7,
      clientResponseTabs: { "tab-a": NOW + 1000 },
    };
    expect(planAcquireLock(old, lockB, 7, NOW).kind).toBe("reject");
    expect(planAcquireLock(old, lockB, 8, NOW).kind).toBe("write");
  });

  it("한 탭을 놓으면 내 탭만 빼고, 남은 탭이 없으면 비운다", () => {
    const held = {
      clientResponseUserIdx: "2_9",
      clientResponseSequence: 8,
      clientResponseTabs: {
        "tab-a": tab("1_1", 7, NOW + 5000),
        "tab-b": tab("2_9", 8, NOW + 5000),
      },
    };
    expect(planReleaseLock(held, lockB, NOW)).toMatchObject({
      kind: "write",
      account: {
        clientResponseUserIdx: "1_1",
        clientResponseSequence: 7,
        clientResponseTabs: { "tab-a": tab("1_1", 7, NOW + 5000) },
      },
    });
    const last = planReleaseLock(
      { ...held, clientResponseTabs: { "tab-b": tab("2_9", 8, NOW + 5000) } },
      lockB,
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
      clientResponseTabs: { "tab-a": tab("1_1", 7, NOW + 5000) },
    };
    for (const plan of [
      planAcquireLock(undefined, lockA, 7, NOW),
      planReleaseLock(held, lockA, NOW),
    ]) {
      if (plan.kind !== "write") throw new Error();
      expect(plan.account).not.toHaveProperty("updated");
    }
  });

  it("내 탭이 이미 없으면(늦은 해제) 아무것도 쓰지 않는다", () => {
    const held = {
      clientResponseUserIdx: "2_9",
      clientResponseTabs: { "tab-b": tab("2_9", 7, NOW + 5000) },
    };
    expect(planReleaseLock(held, lockA, NOW)).toEqual({ kind: "skip" });
  });
});

describe("buildRequestAlarm", () => {
  it("운영 앱이 v3 알림을 구분하도록 origin·threadIdx·sequence를 담고, 캠페인 정보는 본문에 넣는다", () => {
    const alarm = buildRequestAlarm(
      {
        threadUserIdx: 5971,
        userIdx: 42,
        userId: "bigbird",
        sequence: 7,
        threadIdx: 101,
        campaign: {
          campaignIdx: 10,
          campaignCode: "C1",
          productName: "상품",
          mainImageUrl: null,
        },
      },
      10,
      formatWriteTime(NOW),
    );
    expect(alarm).toEqual({
      id: "bigbird",
      callType: "client",
      threadUserIdx: 5971,
      userIdx: 42,
      title: "bigbird 에서/ 상담을 요청하였습니다.",
      body: "캠페인명 : 상품/캠페인코드 : C1/요청시간 : 2026-10-19 10:00:00",
      icon: null,
      campaignIdx: 10,
      origin: "v3",
      threadIdx: 101,
      sequence: 7,
    });
  });
});
