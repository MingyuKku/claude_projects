import { serverApiV3 } from "@/shared/api";

import {
  createRealtimeThread,
  startThreadRealtime,
} from "./realtime-request-api";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  serverApiV3: { post: vi.fn(), put: vi.fn() },
}));

describe("실시간 요청 API", () => {
  it("열린 문의를 같은 스레드에서 전환하고 ThreadCreateV3Response 모양의 응답을 읽는다", async () => {
    vi.mocked(serverApiV3.put).mockResolvedValue({
      result: true,
      data: { sequence: 1280, threadIdx: 2107 },
    });
    await expect(startThreadRealtime(2104)).resolves.toEqual({
      sequence: 1280,
      threadIdx: 2107,
    });
    expect(serverApiV3.put).toHaveBeenCalledWith(
      "/help/thread/2104/realtime",
      undefined,
      { headers: { "X-Device-Id": expect.any(String) } },
    );
  });

  it("처리하지 못했다는 응답은 오류로 던진다", async () => {
    vi.mocked(serverApiV3.put).mockResolvedValue({
      result: false,
      data: { sequence: 1, threadIdx: 1 },
    });
    await expect(startThreadRealtime(2104)).rejects.toThrow();
  });

  it("새 스레드는 실시간 모드로 만든다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValue({
      result: true,
      data: { sequence: 1281, threadIdx: 2108 },
    });
    await expect(createRealtimeThread(null)).resolves.toEqual({
      sequence: 1281,
      threadIdx: 2108,
    });
    expect(serverApiV3.post).toHaveBeenCalledWith(
      "/help/thread",
      { isBoardType: false, campaignIdx: null },
      { headers: { "X-Device-Id": expect.any(String) } },
    );
  });
});
