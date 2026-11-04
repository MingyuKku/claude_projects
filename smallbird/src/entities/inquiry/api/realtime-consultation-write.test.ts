import { beforeEach, describe, expect, it, vi } from "vitest";

import { acquireConsultationLock } from "./realtime-consultation-write";

// 메모리 Firestore. runTransaction은 읽은 문서가 커밋 전에 바뀌었으면 처음부터 다시 실행함(SDK와 같은 동작).
const store = vi.hoisted(() => {
  const data = new Map<string, Record<string, unknown>>();
  const versions = new Map<string, number>();
  const hooks: { afterRead?: () => void } = {};
  const reads: string[] = [];
  return { data, versions, hooks, reads };
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
          store.reads.push(path(ref));
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

describe("realtime-consultation-write", () => {
  beforeEach(() => {
    store.data.clear();
    store.versions.clear();
    store.hooks.afterRead = undefined;
    store.reads.length = 0;
  });

  it("응대 락은 계정 문서만 읽고 쓴다", async () => {
    seed();
    await expect(
      acquireConsultationLock(target, { owner: "42_0", tabId: "tab" }),
    ).resolves.toEqual({ ok: true, skipped: false });
    expect(store.reads).toEqual([ACCOUNT]);
    expect(store.data.get(ACCOUNT)).toMatchObject({
      clientResponseUserIdx: "42_0",
    });
  });
});
