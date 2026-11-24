import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const initializeApp = vi.fn((_options: unknown, name?: string) => ({
  name: name ?? "[DEFAULT]",
}));
const getApps = vi.fn((): { name: string }[] => []);
const getFirestore = vi.fn(() => ({ type: "firestore" }));

vi.mock("firebase/app", () => ({ getApps, initializeApp }));
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

// 설정값은 환경(.env.local, CI)마다 달라서 테스트가 직접 정한다. 모듈을 새로 불러올 때 이 값을 읽는다.
beforeEach(() => {
  vi.stubEnv("VITE_FIREBASE_API_KEY", "test-key");
  vi.stubEnv("VITE_FIREBASE_AUTH_DOMAIN", "test.firebaseapp.com");
  vi.stubEnv("VITE_FIREBASE_PROJECT_ID", "test-project");
  vi.stubEnv("VITE_FIREBASE_APP_ID", "test-app-id");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

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

  it("다른 이름의 앱이 먼저 있어도 Firestore는 기본 앱으로 초기화한다", async () => {
    getApps.mockReturnValue([{ name: "push" }]);
    const getFirestoreDb = await loadGetFirestoreDb();

    await getFirestoreDb();

    // 이름을 넘기지 않아야(인자 하나) 기본 앱이다.
    expect(initializeApp).toHaveBeenCalledExactlyOnceWith({
      apiKey: "test-key",
      authDomain: "test.firebaseapp.com",
      projectId: "test-project",
      appId: "test-app-id",
    });
    getApps.mockReturnValue([]);
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

    expect(post).toHaveBeenCalledExactlyOnceWith(
      "/help/firebase-token",
      undefined,
      { headers: { "X-Device-Id": expect.any(String) } },
    );
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

describe("getFirebaseApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getApps.mockReturnValue([]);
  });

  it("이름별로 앱을 한 번만 만든다", async () => {
    const { getFirebaseApp } = await loadFirebase();
    const [a, b] = await Promise.all([
      getFirebaseApp("push", { appId: "push-app" }),
      getFirebaseApp("push", { appId: "push-app" }),
    ]);

    expect(a).toBe(b);
    expect(initializeApp).toHaveBeenCalledExactlyOnceWith(
      { appId: "push-app" },
      "push",
    );
  });

  it("이미 같은 이름의 앱이 있으면 새로 만들지 않는다", async () => {
    getApps.mockReturnValue([{ name: "push" }]);
    const { getFirebaseApp } = await loadFirebase();

    await expect(getFirebaseApp("push", {})).resolves.toEqual({
      name: "push",
    });
    expect(initializeApp).not.toHaveBeenCalled();
  });

  it("생성이 실패하면 다음 호출에서 다시 시도한다", async () => {
    const { getFirebaseApp } = await loadFirebase();
    initializeApp.mockImplementationOnce(() => {
      throw new Error("init");
    });

    await expect(getFirebaseApp("push", {})).rejects.toThrow("init");
    await expect(getFirebaseApp("push", {})).resolves.toEqual({
      name: "push",
    });
  });
});
