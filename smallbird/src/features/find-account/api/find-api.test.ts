import { authApi, memberApi } from "@/shared/api";

import {
  idEmailSend,
  idEmailVerify,
  idKakaoSend,
  idKakaoVerify,
  pwEmailSend,
  pwKakaoSend,
  pwKakaoVerify,
} from "./find-api";

vi.mock("@/shared/api", () => ({
  authApi: { post: vi.fn() },
  memberApi: { post: vi.fn() },
  serverApi: { post: vi.fn() },
  socialApi: { post: vi.fn() },
}));

const authPost = vi.mocked(authApi.post);
const memberPost = vi.mocked(memberApi.post);

const LOOKUP_OK = {
  success: true,
  data: { id: 42, remainVerificationCount: 2 },
};

beforeEach(() => {
  authPost.mockReset();
  memberPost.mockReset();
  authPost.mockResolvedValue(LOOKUP_OK);
  memberPost.mockResolvedValue({ result: "success" });
});

function lastCall(spy: typeof authPost) {
  const [url, body] = spy.mock.calls[0] ?? [];
  return { url, body: body as Record<string, unknown> };
}

describe("phone verification - id lookup", () => {
  it("posts serviceId=1 and loginId=null to /lookup", async () => {
    await idKakaoSend("김시영", "01097996655");
    const { url, body } = lastCall(authPost);
    expect(url).toBe("/lookup");
    expect(body).toEqual({
      serviceId: 1,
      name: "김시영",
      phoneNumber: "01097996655",
      email: null,
      loginId: null,
    });
  });

  // Another service's (Biglink=6) account must never be looked up: callers have no
  // place to inject a serviceId.
  it("ignores extra arguments so serviceId cannot be overridden", async () => {
    await (idKakaoSend as unknown as (...args: unknown[]) => Promise<unknown>)(
      "홍길동",
      "01000000000",
      { serviceId: 6 },
    );
    const { body } = lastCall(authPost);
    expect(body.serviceId).toBe(1);
    expect(Object.keys(body).sort()).toEqual([
      "email",
      "loginId",
      "name",
      "phoneNumber",
      "serviceId",
    ]);
  });

  it("sends only { id, code } to /verification/loginId", async () => {
    authPost.mockResolvedValue({ success: true, data: { loginId: "abc" } });
    const result = await idKakaoVerify(42, "123456");
    const { url, body } = lastCall(authPost);
    expect(url).toBe("/verification/loginId");
    expect(body).toEqual({ id: 42, code: "123456" });
    expect(result).toEqual({ success: true, data: { loginId: "abc" } });
  });
});

describe("phone verification - password lookup", () => {
  it("sends the registered id as loginId to /lookup", async () => {
    await pwKakaoSend("biglinkai", "김시영", "01097996655");
    const { url, body } = lastCall(authPost);
    expect(url).toBe("/lookup");
    expect(body.serviceId).toBe(1);
    expect(body.loginId).toBe("biglinkai");
    expect(body.email).toBeNull();
  });

  it("sends only { id, code } to /verification/password", async () => {
    authPost.mockResolvedValue({
      success: true,
      data: { resetPasswordCode: "rc" },
    });
    await pwKakaoVerify(77, "654321");
    const { url, body } = lastCall(authPost);
    expect(url).toBe("/verification/password");
    expect(body).toEqual({ id: 77, code: "654321" });
  });
});

describe("auth server response parsing", () => {
  it("accepts the success:false branch", async () => {
    authPost.mockResolvedValue({ success: false, data: { code: "AUTH003" } });
    const result = await idKakaoSend("a", "b");
    expect(result).toEqual({ success: false, data: { code: "AUTH003" } });
  });

  it("rejects a body that is neither branch", async () => {
    authPost.mockResolvedValue({ success: true, data: { id: "x" } });
    await expect(idKakaoSend("a", "b")).rejects.toThrow();
  });
});

describe("email verification - member backend", () => {
  it("idEmailSend adds serviceIdx", async () => {
    await idEmailSend("김시영", "test@example.com");
    expect(memberPost).toHaveBeenCalledWith("/find/id/email", {
      name: "김시영",
      email: "test@example.com",
      serviceIdx: 1,
    });
    expect(authPost).not.toHaveBeenCalled();
  });

  it("idEmailVerify sends the auth number", async () => {
    await idEmailVerify("김시영", "test@example.com", "999999");
    expect(memberPost).toHaveBeenCalledWith("/find/id/email/auth", {
      name: "김시영",
      email: "test@example.com",
      authNumber: "999999",
      serviceIdx: 1,
    });
  });

  it("pwEmailSend sends the registered id", async () => {
    await pwEmailSend("biglinkai", "김시영", "test@example.com");
    expect(memberPost).toHaveBeenCalledWith("/find/pw/email", {
      id: "biglinkai",
      name: "김시영",
      email: "test@example.com",
      serviceIdx: 1,
    });
    expect(authPost).not.toHaveBeenCalled();
  });
});
