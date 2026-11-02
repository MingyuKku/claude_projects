import { beforeEach, describe, expect, it, vi } from "vitest";

const initializeApp = vi.fn(() => ({ name: "app" }));
const getFirestore = vi.fn(() => ({ type: "firestore" }));

vi.mock("firebase/app", () => ({ getApps: () => [], initializeApp }));
vi.mock("firebase/firestore", () => ({ getFirestore }));

// 모듈 안의 캐시를 테스트마다 비우기 위해 매번 새로 불러온다.
async function loadGetFirestoreDb() {
  vi.resetModules();
  return (await import("./firebase")).getFirestoreDb;
}

describe("getFirestoreDb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("동시에 불러도 초기화는 한 번만 한다", async () => {
    const getFirestoreDb = await loadGetFirestoreDb();
    const [a, b] = await Promise.all([getFirestoreDb(), getFirestoreDb()]);

    expect(a).toBe(b);
    expect(initializeApp).toHaveBeenCalledTimes(1);
  });

  it("초기화가 실패하면 다음 호출에서 다시 시도한다", async () => {
    const getFirestoreDb = await loadGetFirestoreDb();
    initializeApp.mockImplementationOnce(() => {
      throw new Error("init");
    });

    await expect(getFirestoreDb()).rejects.toThrow("init");
    await expect(getFirestoreDb()).resolves.toEqual({ type: "firestore" });
    expect(initializeApp).toHaveBeenCalledTimes(2);
  });
});
