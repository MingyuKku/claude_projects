import { beforeEach, describe, expect, it, vi } from "vitest";

const initializeApp = vi.fn(() => ({ name: "app" }));
const getFirestore = vi.fn(() => ({ type: "firestore" }));

vi.mock("firebase/app", () => ({ getApps: () => [], initializeApp }));
vi.mock("firebase/firestore", () => ({ getFirestore }));

const signInWithCustomToken = vi.fn(async () => undefined);
const signOut = vi.fn(async () => undefined);
vi.mock("firebase/auth", () => ({
  initializeAuth: () => ({ type: "auth" }),
  inMemoryPersistence: {},
  signInWithCustomToken,
  signOut,
}));

const post = vi.fn(async () => ({ result: true, token: "custom-token" }));
vi.mock("./clients", () => ({ serverApiV3: { post } }));

// 모듈 안의 캐시를 테스트마다 비우기 위해 매번 새로 불러온다.
async function loadFirebase() {
  vi.resetModules();
  return import("./firebase");
}

async function loadGetFirestoreDb() {
  return (await loadFirebase()).getFirestoreDb;
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

  it("Firestore를 넘기기 전에 백엔드 토큰으로 한 번만 로그인한다", async () => {
    const getFirestoreDb = await loadGetFirestoreDb();
    await Promise.all([getFirestoreDb(), getFirestoreDb()]);

    expect(post).toHaveBeenCalledExactlyOnceWith("/help/firebase-token");
    expect(signInWithCustomToken).toHaveBeenCalledExactlyOnceWith(
      { type: "auth" },
      "custom-token",
    );
  });

  it("로그인이 실패해도 Firestore는 넘기고 로그를 남긴다", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    post.mockResolvedValueOnce({ result: false, token: "" });
    const getFirestoreDb = await loadGetFirestoreDb();

    await expect(getFirestoreDb()).resolves.toEqual({ type: "firestore" });
    expect(signInWithCustomToken).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(
      "Firebase 로그인 실패",
      expect.anything(),
    );
    error.mockRestore();
  });

  it("로그아웃하면 Firebase에서도 나가고 다음 호출에서 다시 로그인한다", async () => {
    const { getFirestoreDb, signOutFirebase } = await loadFirebase();
    await getFirestoreDb();
    await signOutFirebase();
    await getFirestoreDb();

    expect(signOut).toHaveBeenCalledOnce();
    expect(signInWithCustomToken).toHaveBeenCalledTimes(2);
  });

  it("토큰을 받는 사이 로그아웃하면 이전 계정으로 로그인하지 않는다", async () => {
    const { getFirestoreDb, signOutFirebase } = await loadFirebase();
    let resolveToken: (value: {
      result: boolean;
      token: string;
    }) => void = () => {};
    post.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveToken = resolve;
      }),
    );
    const pending = getFirestoreDb();
    await vi.waitFor(() => expect(post).toHaveBeenCalled());
    await signOutFirebase();
    resolveToken({ result: true, token: "old-token" });
    await pending;

    expect(signInWithCustomToken).not.toHaveBeenCalled();
  });

  it("로그인 요청 중에 로그아웃하면 늦게 끝난 이전 계정 로그인을 다시 끊는다", async () => {
    const { getFirestoreDb, signOutFirebase } = await loadFirebase();
    let finishSignIn: () => void = () => {};
    signInWithCustomToken.mockReturnValueOnce(
      new Promise<undefined>((resolve) => {
        finishSignIn = () => resolve(undefined);
      }),
    );
    const pending = getFirestoreDb();
    await vi.waitFor(() => expect(signInWithCustomToken).toHaveBeenCalled());
    await signOutFirebase();
    finishSignIn();
    await pending;

    expect(signOut).toHaveBeenCalledTimes(2);
  });
});
