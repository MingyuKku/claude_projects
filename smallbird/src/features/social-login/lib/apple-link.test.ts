import { requestAppleIdToken } from "./apple-authorize";
import { startAppleLink } from "./apple-link";

vi.mock("./apple-authorize", () => ({ requestAppleIdToken: vi.fn() }));

describe("startAppleLink", () => {
  it("ID 토큰을 받으면 token 요청으로 돌려준다", async () => {
    vi.mocked(requestAppleIdToken).mockResolvedValueOnce("id-token");
    await expect(startAppleLink()).resolves.toEqual({
      status: "token",
      token: "id-token",
    });
  });

  it("팝업을 닫았으면 취소로 돌려준다", async () => {
    vi.mocked(requestAppleIdToken).mockResolvedValueOnce(null);
    await expect(startAppleLink()).resolves.toEqual({ status: "cancelled" });
  });

  it("오류는 그대로 던진다(카드가 실패 안내를 보임)", async () => {
    vi.mocked(requestAppleIdToken).mockRejectedValueOnce(new Error("boom"));
    await expect(startAppleLink()).rejects.toThrow("boom");
  });
});
