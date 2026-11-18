import { serverApiV3 } from "@/shared/api";

import {
  checkAccountValue,
  fetchMasterAccount,
  fetchSocialLinks,
  linkSocial,
  unlinkSocial,
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

const SNS_RESPONSE = {
  items: [
    { platform: "kakao", linked: true, email: "k@example.com" },
    { platform: "naver", linked: false, email: null },
    { platform: "google", linked: false, email: null },
    { platform: "apple", linked: false, email: null },
  ],
};

describe("fetchSocialLinks", () => {
  it("연결 상태 4개를 읽어 SNS별 뷰모델로 바꾼다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValueOnce(SNS_RESPONSE);
    const links = await fetchSocialLinks();
    expect(serverApiV3.get).toHaveBeenCalledWith("/mypage/account/sns");
    expect(links.kakao).toEqual({ isLinked: true, email: "k@example.com" });
    expect(links.naver.isLinked).toBe(false);
  });

  it("items가 없는 응답은 오류를 던진다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValueOnce({});
    await expect(fetchSocialLinks()).rejects.toThrow();
  });
});

describe("unlinkSocial", () => {
  it("플랫폼 경로로 해제하고 응답의 해제 뒤 상태를 돌려준다", async () => {
    vi.mocked(serverApiV3.delete).mockResolvedValueOnce({
      items: SNS_RESPONSE.items.map((item) => ({ ...item, linked: false })),
    });
    const links = await unlinkSocial("kakao");
    expect(serverApiV3.delete).toHaveBeenCalledWith(
      "/mypage/account/sns/kakao",
    );
    expect(links.kakao.isLinked).toBe(false);
  });
});

describe("linkSocial", () => {
  it("인가 코드만 보내고 응답의 연결 뒤 상태를 돌려준다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValueOnce(SNS_RESPONSE);
    const links = await linkSocial("apple", {
      code: "apple-code",
      redirectUri: "https://x.test/auth/apple",
    });
    expect(serverApiV3.post).toHaveBeenCalledWith("/mypage/account/sns/apple", {
      code: "apple-code",
      redirectUri: "https://x.test/auth/apple",
    });
    expect(links.kakao).toEqual({ isLinked: true, email: "k@example.com" });
  });

  it("인가 코드는 code와 redirectUri만 보낸다(토큰 교환은 서버가 함)", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValueOnce(SNS_RESPONSE);
    await linkSocial("google", {
      code: "auth-code",
      redirectUri: "https://example.com/auth/google",
    });
    expect(serverApiV3.post).toHaveBeenCalledWith(
      "/mypage/account/sns/google",
      {
        code: "auth-code",
        redirectUri: "https://example.com/auth/google",
      },
    );
  });
});
