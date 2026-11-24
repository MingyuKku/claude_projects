import { beforeEach, describe, expect, it, vi } from "vitest";

const initializeApp = vi.fn((_options: unknown, name?: string) => ({
  name: name ?? "[DEFAULT]",
}));
const getApps = vi.fn((): { name: string }[] => []);
vi.mock("firebase/app", () => ({ getApps, initializeApp }));

const isSupported = vi.fn(async () => true);
const getMessaging = vi.fn(() => ({ type: "messaging" }));
const getToken = vi.fn<
  (messaging: unknown, options: unknown) => Promise<string>
>(async () => "fcm-token");
vi.mock("firebase/messaging", () => ({ getMessaging, getToken, isSupported }));

const configured = vi.hoisted(() => ({ value: true }));
vi.mock("@/shared/config", () => ({
  ENV: {
    firebaseApiKey: "key",
    firebaseAuthDomain: "domain",
    firebaseProjectId: "project",
    firebaseAppId: "helpdesk-app",
    firebasePushAppId: "push-app",
    firebaseMessagingSenderId: "sender",
    firebaseVapidKey: "vapid",
  },
  isWebPushConfigured: () => configured.value,
}));

vi.mock("./clients", () => ({ serverApiV3: { post: vi.fn() } }));

async function loadMessaging() {
  vi.resetModules();
  return import("./firebase-messaging");
}

function stubBrowser({ permission }: { permission: NotificationPermission }) {
  vi.stubGlobal("Notification", { permission });
  vi.stubGlobal("PushManager", class {});
  Object.defineProperty(navigator, "serviceWorker", {
    value: {},
    configurable: true,
  });
}

describe("getWebPushPermission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    configured.value = true;
  });

  it("설정값이 없으면 지원하지 않는 것으로 본다", async () => {
    stubBrowser({ permission: "granted" });
    configured.value = false;
    const { getWebPushPermission } = await loadMessaging();

    expect(getWebPushPermission()).toBe("unsupported");
  });

  it("브라우저가 푸시를 지원하지 않으면 지원하지 않는 것으로 본다", async () => {
    vi.stubGlobal("Notification", undefined);
    vi.stubGlobal("PushManager", undefined);
    Reflect.deleteProperty(window, "Notification");
    Reflect.deleteProperty(window, "PushManager");
    const { getWebPushPermission } = await loadMessaging();

    expect(getWebPushPermission()).toBe("unsupported");
  });

  it("지원하면 브라우저 권한 값을 그대로 돌려준다", async () => {
    stubBrowser({ permission: "default" });
    const { getWebPushPermission } = await loadMessaging();

    expect(getWebPushPermission()).toBe("default");
  });
});

describe("getWebPushToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    configured.value = true;
  });

  it("권한이 허용되지 않았으면 SDK를 불러오지 않고 null이다", async () => {
    stubBrowser({ permission: "default" });
    const { getWebPushToken } = await loadMessaging();

    await expect(getWebPushToken()).resolves.toBeNull();
    expect(initializeApp).not.toHaveBeenCalled();
    expect(getToken).not.toHaveBeenCalled();
  });

  it("권한이 허용되면 푸시 전용 앱으로 토큰을 받는다", async () => {
    stubBrowser({ permission: "granted" });
    const { getWebPushToken } = await loadMessaging();

    await expect(getWebPushToken()).resolves.toBe("fcm-token");
    expect(initializeApp).toHaveBeenCalledExactlyOnceWith(
      {
        apiKey: "key",
        authDomain: "domain",
        projectId: "project",
        appId: "push-app",
        messagingSenderId: "sender",
      },
      "push",
    );
    expect(getToken).toHaveBeenCalledExactlyOnceWith(
      { type: "messaging" },
      { vapidKey: "vapid" },
    );
  });

  it("SDK가 지원하지 않는 환경이면 토큰을 받지 않고 null이다", async () => {
    stubBrowser({ permission: "granted" });
    isSupported.mockResolvedValueOnce(false);
    const { getWebPushToken } = await loadMessaging();

    await expect(getWebPushToken()).resolves.toBeNull();
    expect(getToken).not.toHaveBeenCalled();
  });

  it("여러 번 불러도 앱은 한 번만 만든다", async () => {
    stubBrowser({ permission: "granted" });
    const { getWebPushToken } = await loadMessaging();

    await Promise.all([getWebPushToken(), getWebPushToken()]);

    expect(initializeApp).toHaveBeenCalledTimes(1);
  });
});

describe("requestWebPushPermission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    configured.value = true;
  });

  function stubPermissionRequest(
    initial: NotificationPermission,
    answer: NotificationPermission,
  ) {
    const requestPermission = vi.fn(async () => {
      stub.permission = answer;
      return answer;
    });
    const stub = { permission: initial, requestPermission };
    vi.stubGlobal("Notification", stub);
    vi.stubGlobal("PushManager", class {});
    Object.defineProperty(navigator, "serviceWorker", {
      value: {},
      configurable: true,
    });
    return requestPermission;
  }

  it("아직 묻지 않았으면 권한 창을 띄우고 사용자의 답을 돌려준다", async () => {
    const requestPermission = stubPermissionRequest("default", "granted");
    const { requestWebPushPermission } = await loadMessaging();

    await expect(requestWebPushPermission()).resolves.toBe("granted");
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  it.each(["granted", "denied"] as const)(
    "이미 %s이면 다시 묻지 않고 그대로 돌려준다",
    async (permission) => {
      const requestPermission = stubPermissionRequest(permission, "granted");
      const { requestWebPushPermission } = await loadMessaging();

      await expect(requestWebPushPermission()).resolves.toBe(permission);
      expect(requestPermission).not.toHaveBeenCalled();
    },
  );

  it("설정값이 없으면 묻지 않는다", async () => {
    const requestPermission = stubPermissionRequest("default", "granted");
    configured.value = false;
    const { requestWebPushPermission } = await loadMessaging();

    await expect(requestWebPushPermission()).resolves.toBe("unsupported");
    expect(requestPermission).not.toHaveBeenCalled();
  });
});
