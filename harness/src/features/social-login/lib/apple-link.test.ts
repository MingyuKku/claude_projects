import { requestAppleCode } from "./apple-authorize";
import { startAppleLink } from "./apple-link";

vi.mock("./apple-authorize", () => ({ requestAppleCode: vi.fn() }));

describe("startAppleLink", () => {
  it("인가 코드를 받으면 code 요청으로 돌려준다", async () => {
    vi.mocked(requestAppleCode).mockResolvedValueOnce({
      code: "apple-code",
      redirectUri: "https://x.test/auth/apple",
    });
    await expect(startAppleLink()).resolves.toEqual({
      status: "code",
      code: "apple-code",
      redirectUri: "https://x.test/auth/apple",
    });
  });

  it("팝업을 닫았으면 취소로 돌려준다", async () => {
    vi.mocked(requestAppleCode).mockResolvedValueOnce(null);
    await expect(startAppleLink()).resolves.toEqual({ status: "cancelled" });
  });

  it("오류는 그대로 던진다(카드가 실패 안내를 보임)", async () => {
    vi.mocked(requestAppleCode).mockRejectedValueOnce(new Error("boom"));
    await expect(startAppleLink()).rejects.toThrow("boom");
  });
});
