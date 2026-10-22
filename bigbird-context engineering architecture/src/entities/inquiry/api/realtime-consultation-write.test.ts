import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  appendConsultationMessage,
  cancelRealtimeRequest,
  closeConsultation,
  createRealtimeRequest,
} from "./realtime-consultation-write";

// 메모리 Firestore. runTransaction은 읽은 문서가 커밋 전에 바뀌었으면 처음부터 다시 실행함(SDK와 같은 동작).
const store = vi.hoisted(() => {
  const data = new Map<string, Record<string, unknown>>();
  const versions = new Map<string, number>();
  const hooks: { afterRead?: () => void } = {};
  return { data, versions, hooks };
});

const path = (ref: { path: string }) => ref.path;
const bump = (key: string) =>
  store.versions.set(key, (store.versions.get(key) ?? 0) + 1);

vi.mock("@/shared/api", () => ({ getFirestoreDb: async () => ({}) }));
vi.mock("firebase/firestore", () => ({
  doc: (parent: unknown, ...segments: string[]) => {
    const base =
      typeof parent === "object" && parent && "path" in parent
        ? (parent as { path: string }).path
        : "";
    return { path: [base, ...segments].filter(Boolean).join("/") };
  },
  runTransaction: async (
    _db: unknown,
    fn: (tx: unknown) => Promise<unknown>,
  ) => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const seen = new Map<string, number>();
      const writes: (() => void)[] = [];
      const tx = {
        get: async (ref: { path: string }) => {
          seen.set(path(ref), store.versions.get(path(ref)) ?? 0);
          const value = store.data.get(path(ref));
          return {
            exists: () => value !== undefined,
            data: () => structuredClone(value),
          };
        },
        update: (ref: { path: string }, patch: Record<string, unknown>) =>
          writes.push(() => {
            if (!store.data.has(path(ref))) throw new Error("missing doc");
            store.data.set(path(ref), {
              ...store.data.get(path(ref)),
              ...structuredClone(patch),
            });
            bump(path(ref));
          }),
        set: (ref: { path: string }, value: Record<string, unknown>) =>
          writes.push(() => {
            store.data.set(path(ref), structuredClone(value));
            bump(path(ref));
          }),
      };
      const result = await fn(tx);
      store.hooks.afterRead?.();
      const stale = [...seen].some(
        ([key, v]) => (store.versions.get(key) ?? 0) !== v,
      );
      if (stale) continue;
      writes.forEach((write) => write());
      return result;
    }
    throw new Error("too many retries");
  },
}));

const ACCOUNT = "helpdesk/0.0.2/threadUserIdx/5971";
const SEQ = `${ACCOUNT}/sequence/7`;
const target = { threadUserIdx: 5971, sequence: 7 };
const connected = { ...target, threadIdx: 101 };

function seed(overrides: Record<string, unknown> = {}) {
  store.data.set(ACCOUNT, { clientResponseUserIdx: null });
  store.data.set(SEQ, {
    sequence: 7,
    threadIdx: 101,
    isConnect: true,
    finishTime: null,
    messages: [],
    ...overrides,
  });
}

function text(messageId: string, body: string, isUserMessage: boolean) {
  return {
    requireConnected: true,
    message: {
      auto: false,
      attachmentIdx: null,
      identifier: "x",
      isUserMessage,
      body,
      fileName: null,
      messageId,
    },
  };
}

const messageIds = () =>
  (store.data.get(SEQ)?.messages as { messageId: string }[]).map(
    (m) => m.messageId,
  );

describe("realtime-consultation-write", () => {
  beforeEach(() => {
    store.data.clear();
    store.versions.clear();
    store.hooks.afterRead = undefined;
  });

  it("동시에 보낸 두 메시지가 모두 남는다(재시도로 최신 배열에 붙인다)", async () => {
    seed();
    // 첫 트랜잭션이 읽은 직후 다른 앱(운영)이 메시지를 하나 추가한 상황을 만든다.
    let injected = false;
    store.hooks.afterRead = () => {
      if (injected) return;
      injected = true;
      store.data.set(SEQ, {
        ...store.data.get(SEQ),
        messages: [{ messageId: "op1", body: "운영자" }],
      });
      bump(SEQ);
    };
    const result = await appendConsultationMessage(
      connected,
      text("m1", "광고주", true),
    );
    expect(result).toEqual({ ok: true, skipped: false });
    expect(messageIds()).toEqual(["op1", "m1"]);
  });

  it("같은 메시지를 다시 보내도 한 번만 남는다", async () => {
    seed();
    await appendConsultationMessage(connected, text("m1", "안녕", true));
    const again = await appendConsultationMessage(
      connected,
      text("m1", "안녕", true),
    );
    expect(again).toEqual({ ok: true, skipped: true });
    expect(messageIds()).toEqual(["m1"]);
  });

  it("종료: REST 실패 시 전송이 막힌 채 남고, 다시 호출하면 이어서 한 번만 종료한다", async () => {
    seed();
    const closeRest = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue(undefined);
    await expect(closeConsultation(target, { closeRest })).rejects.toThrow(
      "network",
    );
    expect(store.data.get(SEQ)?.closingAt).toBeTruthy();
    expect(
      await appendConsultationMessage(connected, text("m1", "늦은 전송", true)),
    ).toEqual({
      ok: false,
      reason: "closing",
    });

    await closeConsultation(target, { closeRest });
    await closeConsultation(target, { closeRest });
    expect(store.data.get(SEQ)?.finishTime).toBeTruthy();
    expect(messageIds()).toEqual(["close:7"]);
  });

  it("취소하면 이후 전송이 거절되고, 연결된 요청은 취소되지 않는다", async () => {
    seed({ isConnect: false });
    expect(await cancelRealtimeRequest(target)).toEqual({
      ok: true,
      skipped: false,
    });
    expect(
      await appendConsultationMessage(connected, text("m1", "x", true)),
    ).toEqual({
      ok: false,
      reason: "canceled",
    });
    seed({ isConnect: true });
    expect(await cancelRealtimeRequest(target)).toEqual({
      ok: false,
      reason: "connected",
    });
  });

  it("요청 생성은 같은 sequence를 한 번만 만든다", async () => {
    store.data.set(ACCOUNT, { clientResponseUserIdx: null, adminClose: true });
    const input = {
      ...target,
      userIdx: 42,
      userId: "bigbird",
      threadIdx: 101,
      campaign: null,
      firstMessage: null,
      now: Date.now(),
    };
    expect(await createRealtimeRequest(input)).toEqual({ skipped: false });
    expect(await createRealtimeRequest(input)).toEqual({ skipped: true });
    expect(store.data.get(SEQ)).toMatchObject({
      origin: "v3",
      isConnect: false,
    });
    expect(store.data.get(ACCOUNT)).toMatchObject({
      newSenderUserIdx: 1,
      adminClose: true,
    });
  });
});
