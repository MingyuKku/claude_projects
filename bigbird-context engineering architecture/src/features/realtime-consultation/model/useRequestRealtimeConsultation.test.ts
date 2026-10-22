import { act, renderHook } from "@testing-library/react";

import { useRequestRealtimeConsultation } from "./useRequestRealtimeConsultation";

const mocks = vi.hoisted(() => ({
  createThread: vi.fn(),
  createRequest: vi.fn(),
  retry: vi.fn(),
}));

vi.mock("@/entities/inquiry", () => ({
  buildRequestAlarm: () => ({ alarm: true }),
  createRealtimeRequest: mocks.createRequest,
  createRealtimeThread: mocks.createThread,
  formatWriteTime: () => "2026-10-19 18:00:00",
  newMessageId: () => "first",
  retryRealtimeRequest: mocks.retry,
  toCampaignCardBody: () => "{}",
}));

const session = { userIdx: 42, threadUserIdx: 5971, identifier: "bigbird" };

describe("useRequestRealtimeConsultation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createThread.mockResolvedValue({ sequence: 7, threadIdx: 101 });
    mocks.createRequest.mockResolvedValue({ skipped: false });
    mocks.retry.mockResolvedValue({ ok: true, skipped: false });
  });

  it("새 상담 문서를 만들면 재요청하지 않는다", async () => {
    const { result } = renderHook(() =>
      useRequestRealtimeConsultation(session),
    );
    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.request(null);
    });
    expect(outcome).toEqual({ status: "requested", threadIdx: 101 });
    expect(mocks.retry).not.toHaveBeenCalled();
  });

  it("서버가 기존 요청을 돌려줘 문서가 이미 있으면 같은 요청을 다시 요청한다", async () => {
    mocks.createRequest.mockResolvedValue({ skipped: true });
    const { result } = renderHook(() =>
      useRequestRealtimeConsultation(session),
    );
    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.request(null);
    });
    expect(outcome).toEqual({ status: "requested", threadIdx: 101 });
    expect(mocks.retry).toHaveBeenCalledWith(
      { threadUserIdx: 5971, sequence: 7 },
      { alarm: true },
    );
  });

  it("재요청이 실패해도 요청은 이동하고, 요청 실패 화면에서 다시 시도할 수 있다", async () => {
    mocks.createRequest.mockResolvedValue({ skipped: true });
    mocks.retry.mockRejectedValue(new Error("network"));
    const { result } = renderHook(() =>
      useRequestRealtimeConsultation(session),
    );
    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.request(null);
    });
    expect(outcome).toEqual({ status: "requested", threadIdx: 101 });
  });
});
