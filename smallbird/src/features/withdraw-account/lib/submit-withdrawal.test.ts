import { verifyCurrentPassword } from "@/entities/account";

import { exitAccount } from "../api/withdraw-api";
import { submitWithdrawal } from "./submit-withdrawal";

import type * as EntitiesAccount from "@/entities/account";

vi.mock("@/entities/account", async (importOriginal) => ({
  ...(await importOriginal<typeof EntitiesAccount>()),
  verifyCurrentPassword: vi.fn(),
}));
vi.mock("../api/withdraw-api");

beforeEach(() => {
  vi.resetAllMocks();
});

describe("submitWithdrawal", () => {
  it("비밀번호가 맞으면 탈퇴를 처리하고 done을 돌려준다", async () => {
    vi.mocked(verifyCurrentPassword).mockResolvedValue(true);
    vi.mocked(exitAccount).mockResolvedValue({ result: true });
    expect(await submitWithdrawal("pw")).toBe("done");
    expect(verifyCurrentPassword).toHaveBeenCalledWith("pw");
  });

  it("비밀번호가 다르면 탈퇴를 호출하지 않고 wrongPassword를 돌려준다", async () => {
    vi.mocked(verifyCurrentPassword).mockResolvedValue(false);
    expect(await submitWithdrawal("pw")).toBe("wrongPassword");
    expect(exitAccount).not.toHaveBeenCalled();
  });

  it("비밀번호 확인 요청이 실패하면 틀린 것과 구분해 failed를 돌려준다", async () => {
    vi.mocked(verifyCurrentPassword).mockRejectedValue(new Error("network"));
    expect(await submitWithdrawal("pw")).toBe("failed");
    expect(exitAccount).not.toHaveBeenCalled();
  });

  it("탈퇴가 result:false이거나 요청이 실패하면 failed를 돌려준다", async () => {
    vi.mocked(verifyCurrentPassword).mockResolvedValue(true);
    vi.mocked(exitAccount).mockResolvedValueOnce({ result: false });
    expect(await submitWithdrawal("pw")).toBe("failed");
    vi.mocked(exitAccount).mockRejectedValueOnce(new Error("500"));
    expect(await submitWithdrawal("pw")).toBe("failed");
  });
});
