import { act, renderHook } from "@testing-library/react";

import { useRequestRealtimeConsultation } from "./useRequestRealtimeConsultation";

import type { InquiryCampaignViewModel } from "@/entities/inquiry";

const mocks = vi.hoisted(() => ({
  createThread: vi.fn(),
  startThread: vi.fn(),
  send: vi.fn(),
  updateAccount: vi.fn(),
}));

vi.mock("@/entities/inquiry", () => ({
  buildRequestAlarm: () => ({ alarm: true }),
  createRealtimeThread: mocks.createThread,
  formatWriteTime: () => "2026-10-19 18:00:00",
  sendInquiryMessage: mocks.send,
  startThreadRealtime: mocks.startThread,
  toCampaignCardBody: () => "{card}",
  updateHelpdeskAccount: mocks.updateAccount,
}));

const session = { userIdx: 42, threadUserIdx: 5971, identifier: "bigbird" };
const campaign = {
  campaignIdx: 10,
  campaignCode: "C1",
  productName: "상품",
  imageUrl: null,
} as InquiryCampaignViewModel;

async function request(
  ...args: Parameters<
    ReturnType<typeof useRequestRealtimeConsultation>["request"]
  >
) {
  const { result } = renderHook(() => useRequestRealtimeConsultation(session));
  let outcome: unknown;
  await act(async () => {
    outcome = await result.current.request(...args);
  });
  return outcome;
}

describe("useRequestRealtimeConsultation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createThread.mockResolvedValue({ sequence: 7, threadIdx: 101 });
    mocks.startThread.mockResolvedValue({ sequence: 7, threadIdx: 101 });
    mocks.send.mockResolvedValue(101);
    mocks.updateAccount.mockResolvedValue(undefined);
  });

  it("REST로 요청하고 계정 문서에는 프론트 필드(알림 등)만 쓴다", async () => {
    expect(await request(null)).toEqual({
      status: "requested",
      threadIdx: 101,
    });
    expect(mocks.createThread).toHaveBeenCalledWith(null);
    expect(mocks.updateAccount).toHaveBeenCalledWith(5971, {
      threadBoardType: 0,
      newSenderUserIdx: 1,
      currentCampaignIdx: null,
      alarmData: { alarm: true },
    });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("열린 문의면 같은 스레드를 실시간으로 바꾸고 카드는 다시 보내지 않는다", async () => {
    await request(campaign, { threadIdx: 101 });
    expect(mocks.startThread).toHaveBeenCalledWith(101);
    expect(mocks.createThread).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("보고 있는 문의가 끝났어도 같은 PUT으로 요청한다", async () => {
    await request(campaign, { threadIdx: 90 });
    expect(mocks.startThread).toHaveBeenCalledWith(90);
    expect(mocks.createThread).not.toHaveBeenCalled();
  });

  it("서버가 새 스레드를 만들면 그 번호로 가고 첫 메시지로 캠페인 카드를 보낸다", async () => {
    mocks.startThread.mockResolvedValue({ sequence: 8, threadIdx: 102 });
    expect(
      await request(campaign, {
        threadIdx: 99,
      }),
    ).toEqual({ status: "requested", threadIdx: 102 });
    expect(mocks.send).toHaveBeenCalledWith({
      threadIdx: 102,
      body: "{card}",
      isAuto: true,
    });
  });

  it("열린 문의가 없어 새로 만든 스레드에는 캠페인 카드를 보낸다", async () => {
    await request(campaign);
    expect(mocks.send).toHaveBeenCalledWith({
      threadIdx: 101,
      body: "{card}",
      isAuto: true,
    });
  });

  it("REST 요청이 실패하면 알림을 쓰지 않는다", async () => {
    mocks.createThread.mockRejectedValue(new Error("network"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await request(null)).toEqual({ status: "restFailed" });
    expect(mocks.updateAccount).not.toHaveBeenCalled();
  });

  it("알림 기록이 실패해도 요청은 성공으로 이동한다", async () => {
    mocks.updateAccount.mockRejectedValue(new Error("no doc"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await request(null)).toEqual({
      status: "requested",
      threadIdx: 101,
    });
  });
});
