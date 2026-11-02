import { serverApiV3 } from "@/shared/api";

import {
  checkAccountValue,
  fetchMasterAccount,
  verifyCurrentPassword,
} from "./mypage-api";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    serverApiV3: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

describe("checkAccountValue", () => {
  it("result가 false면 사용 가능, true면 이미 사용 중이다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValueOnce({ result: false });
    expect(await checkAccountValue("id", "hong1234")).toBe("available");
    expect(serverApiV3.post).toHaveBeenCalledWith("/mypage/account/check/id", {
      data: "hong1234",
    });

    vi.mocked(serverApiV3.post).mockResolvedValueOnce({ result: true });
    expect(await checkAccountValue("email", "a@b.com")).toBe("taken");
  });

  it("result가 없는 응답은 사용 가능으로 읽지 않고 오류를 던진다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValueOnce({});
    await expect(checkAccountValue("id", "hong1234")).rejects.toThrow();
  });
});

describe("verifyCurrentPassword", () => {
  it("비밀번호는 id·email과 반대로 true가 일치다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValueOnce({ result: true });
    expect(await verifyCurrentPassword("Abcd1234!")).toBe(true);
    expect(serverApiV3.post).toHaveBeenLastCalledWith(
      "/mypage/account/check/pw",
      { data: "Abcd1234!" },
    );
  });
});

describe("fetchMasterAccount", () => {
  it("응답을 검증해 뷰모델로 바꾼다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValueOnce({
      result: true,
      user: { identifier: "advertiser01", email: "a@b.com" },
    });
    const master = await fetchMasterAccount();
    expect(serverApiV3.get).toHaveBeenCalledWith("/mypage/account/master");
    expect(master.profile.identifier).toBe("advertiser01");
    expect(master.company).toBeNull();
  });
});
