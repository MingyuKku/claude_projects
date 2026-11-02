import { serverApiV3 } from "@/shared/api";

import { requestWithdraw } from "./withdraw-api";

import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApiV3: { post: vi.fn() },
}));

describe("requestWithdraw", () => {
  it("request JSON 파트와 bankBook 파일 파트로 보내고 응답을 뷰모델로 바꾼다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValue({
      id: "W1",
      requestDate: "2026-10-30 10:30:00",
      amount: 800000,
      status: "PENDING",
      balance: 800000,
    });
    const bankBook = new File(["x"], "통장.pdf", { type: "application/pdf" });

    const result = await requestWithdraw(
      {
        bankIdx: 3,
        accountNumber: "1234",
        accountHolder: "홍길동",
        amount: 800000,
      },
      bankBook,
    );

    const [path, form] = vi.mocked(serverApiV3.post).mock.calls[0] ?? [];
    expect(path).toBe("/mypage/bigbird-money/withdraw");
    expect(form).toBeInstanceOf(FormData);
    const data = form as FormData;
    const request = data.get("request") as Blob;
    expect(request.type).toBe("application/json");
    expect(JSON.parse(await request.text())).toEqual({
      bankIdx: 3,
      accountNumber: "1234",
      accountHolder: "홍길동",
      amount: 800000,
    });
    expect((data.get("bankBook") as File).name).toBe("통장.pdf");
    expect(result).toEqual({
      id: "W1",
      requestedAt: new Date("2026-10-30T10:30:00"),
      amount: 800000,
    });
  });
});
