import { act, renderHook, waitFor } from "@testing-library/react";

import { useRealtimeConversation } from "./useRealtimeConversation";

import type { BigbirdInquiryViewModel } from "@/entities/inquiry";

const mocks = vi.hoisted(() => ({
  acquire: vi.fn(),
  release: vi.fn(),
  append: vi.fn(),
  cancel: vi.fn(),
  close: vi.fn(),
  closeRest: vi.fn(),
  expire: vi.fn(),
  retry: vi.fn(),
  upload: vi.fn(),
  toastError: vi.fn(),
  ids: 0,
}));

vi.mock("@/entities/inquiry", () => ({
  abortConsultationClose: vi.fn(),
  acquireConsultationLock: mocks.acquire,
  appendConsultationMessage: mocks.append,
  buildRequestAlarm: () => ({}),
  cancelRealtimeRequest: mocks.cancel,
  closeBigbirdInquiry: mocks.closeRest,
  closeConsultation: mocks.close,
  getAttachmentKind: (file: { name: string }) =>
    /\.(png|jpg)$/i.test(file.name) ? "image" : null,
  LOCK_REFRESH_MS: 15_000,
  markRealtimeRequestExpired: mocks.expire,
  newMessageId: () => `id-${++mocks.ids}`,
  releaseConsultationLock: mocks.release,
  retryRealtimeRequest: mocks.retry,
  TAB_ID: "tab-1",
  uploadInquiryAttachment: mocks.upload,
}));
vi.mock("sonner", () => ({ toast: { error: mocks.toastError } }));

const session = {
  userIdx: 42,
  accountIdx: 3,
  threadUserIdx: 5971,
  identifier: "bigbird",
};

function inquiry(
  overrides: Partial<BigbirdInquiryViewModel> = {},
): BigbirdInquiryViewModel {
  return {
    threadIdx: 101,
    sequence: 7,
    campaignIdx: 55,
    isRealtime: true,
    isFinished: false,
    status: "consulting",
    realtimePhase: "connected",
    createdAt: new Date("2026-10-19T10:00:00"),
    messages: [],
    ...overrides,
  };
}

function setup(
  value: BigbirdInquiryViewModel | null = inquiry(),
  enabled = true,
) {
  const onChanged = vi.fn();
  const onLeaveForMessage = vi.fn();
  const hook = renderHook(() =>
    useRealtimeConversation({
      inquiry: value ?? undefined,
      session,
      enabled,
      onChanged,
      onLeaveForMessage,
    }),
  );
  return { ...hook, onChanged, onLeaveForMessage };
}

describe("useRealtimeConversation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ids = 0;
    mocks.acquire.mockResolvedValue({ ok: true, skipped: false });
    mocks.release.mockResolvedValue({ ok: true, skipped: false });
    mocks.append.mockResolvedValue({ ok: true, skipped: false });
    mocks.cancel.mockResolvedValue({ ok: true, skipped: false });
    mocks.close.mockResolvedValue({ ok: true, skipped: false });
    mocks.expire.mockResolvedValue({ ok: true, skipped: false });
    mocks.retry.mockResolvedValue({ ok: true, skipped: false });
    mocks.upload.mockResolvedValue({
      url: "https://cdn/a.png",
      attachmentIdx: 9,
      fileName: "a.png",
      fileSize: 1,
    });
  });

  it("쓰기를 끄면 Firestore를 건드리지 않는다", () => {
    const { result } = setup(inquiry(), false);
    expect(result.current.lock).toBe("inactive");
    expect(mocks.acquire).not.toHaveBeenCalled();
  });

  it("상담을 보는 동안 락을 얻고 화면을 떠나면 내 탭만 해제한다", async () => {
    const { result, unmount } = setup();
    await waitFor(() => expect(result.current.lock).toBe("held"));
    expect(mocks.acquire).toHaveBeenCalledWith(
      { threadUserIdx: 5971, sequence: 7 },
      { owner: "42_3", tabId: "tab-1" },
    );
    expect(result.current.canSend).toBe(true);
    unmount();
    expect(mocks.release).toHaveBeenCalledOnce();
  });

  it("다른 계정이 락을 가졌으면 막히고 전송할 수 없으며 해제도 하지 않는다", async () => {
    mocks.acquire.mockResolvedValue({ ok: false, reason: "lock-lost" });
    const { result, unmount } = setup();
    await waitFor(() => expect(result.current.lock).toBe("blocked"));
    expect(result.current.canSend).toBe(false);
    unmount();
    expect(mocks.release).not.toHaveBeenCalled();
  });

  it("열린 문의가 없으면(자동 선택 등) 락을 잡지 않는다", () => {
    const { result } = setup(null);
    expect(result.current.lock).toBe("inactive");
    expect(mocks.acquire).not.toHaveBeenCalled();
  });

  it("갱신이 일시 오류로 실패해도 다음 주기에 다시 시도해 락을 되찾는다", async () => {
    vi.useFakeTimers();
    try {
      mocks.acquire
        .mockResolvedValueOnce({ ok: true, skipped: false })
        .mockRejectedValueOnce(new Error("network"))
        .mockResolvedValue({ ok: true, skipped: false });
      const { result } = setup();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(result.current.lock).toBe("held");
      await act(async () => {
        await vi.advanceTimersByTimeAsync(15_000);
      });
      expect(result.current.lock).toBe("error");
      await act(async () => {
        await vi.advanceTimersByTimeAsync(15_000);
      });
      expect(result.current.lock).toBe("held");
      expect(mocks.acquire).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it("락 응답이 화면을 떠난 뒤에 도착해도 얻은 락을 바로 놓는다", async () => {
    let resolveAcquire: (value: unknown) => void = () => {};
    mocks.acquire.mockReturnValue(
      new Promise((resolve) => {
        resolveAcquire = resolve;
      }),
    );
    const { unmount } = setup();
    unmount();
    await act(async () => {
      resolveAcquire({ ok: true, skipped: false });
    });
    expect(mocks.release).toHaveBeenCalledOnce();
  });

  it("요청 실패 후 만료 기록이 실패하면 잠시 뒤 다시 시도한다", async () => {
    vi.useFakeTimers();
    try {
      mocks.expire
        .mockRejectedValueOnce(new Error("network"))
        .mockResolvedValue({ ok: true, skipped: false });
      setup(inquiry({ realtimePhase: "failed", connectDeadlineAt: 1000 }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(mocks.expire).toHaveBeenCalledTimes(1);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(15_000);
      });
      expect(mocks.expire).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("락 확인이 오류로 실패하면 입력이 막힌 이유를 한 번 알린다", async () => {
    mocks.acquire.mockRejectedValue(new Error("network"));
    const { result } = setup();
    await waitFor(() => expect(result.current.lock).toBe("error"));
    expect(result.current.canSend).toBe(false);
    expect(mocks.toastError).toHaveBeenCalledTimes(1);
  });

  it("다른 계정이 락을 쥐어 거절되면 더 이상 갱신하지 않는다", async () => {
    vi.useFakeTimers();
    try {
      mocks.acquire.mockResolvedValue({ ok: false, reason: "lock-lost" });
      const { result } = setup();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(45_000);
      });
      expect(result.current.lock).toBe("blocked");
      expect(mocks.acquire).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("연결 전(요청 중)에도 락을 가졌으면 미리 보낼 수 있다", async () => {
    const { result } = setup(inquiry({ realtimePhase: "requesting" }));
    await waitFor(() => expect(result.current.lock).toBe("held"));
    expect(result.current.canSend).toBe(true);
  });

  it("요청 실패 상태에서는 입력도 막는다", async () => {
    const { result } = setup(inquiry({ realtimePhase: "failed" }));
    await waitFor(() => expect(result.current.lock).toBe("held"));
    expect(result.current.canSend).toBe(false);
  });

  it("전송이 오류로 끝난 뒤 같은 글을 다시 보내면 같은 messageId를 쓴다", async () => {
    const { result } = setup();
    mocks.append.mockRejectedValueOnce(new Error("network"));
    await act(async () => {
      expect(await result.current.send("안녕하세요")).toBe(false);
    });
    await act(async () => {
      expect(await result.current.send("안녕하세요")).toBe(true);
    });
    const ids = mocks.append.mock.calls.map(
      ([, input]) => input.message.messageId,
    );
    expect(ids[0]).toBe(ids[1]);
    // 성공했으니 다음 글은 새 식별자.
    await act(async () => {
      await result.current.send("안녕하세요");
    });
    expect(mocks.append.mock.calls[2]?.[1].message.messageId).not.toBe(ids[0]);
  });

  it("거절되면 입력을 지키기 위해 false를 돌려주고 안내를 띄운다", async () => {
    mocks.append.mockResolvedValue({ ok: false, reason: "closing" });
    const { result } = setup();
    await act(async () => {
      expect(await result.current.send("x")).toBe(false);
    });
    expect(mocks.toastError).toHaveBeenCalledOnce();
  });

  it("종료는 REST 종료를 closeConsultation에 넘기고 끝나면 목록을 갱신한다", async () => {
    const { result, onChanged } = setup();
    await act(async () => {
      expect(await result.current.end()).toBe(true);
    });
    const [, options] = mocks.close.mock.calls[0] ?? [];
    await options.closeRest();
    expect(mocks.closeRest).toHaveBeenCalledWith(101);
    expect(onChanged).toHaveBeenCalledOnce();
  });

  it("종료 중 오류가 나면 안내하고 목록은 건드리지 않는다", async () => {
    mocks.close.mockRejectedValue(new Error("rest"));
    const { result, onChanged } = setup();
    await act(async () => {
      expect(await result.current.end()).toBe(false);
    });
    expect(mocks.toastError).toHaveBeenCalled();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it("문의 메시지로 남기기: 취소 → 요청 정리 → 같은 캠페인으로 이동", async () => {
    const { result, onLeaveForMessage } = setup(
      inquiry({ realtimePhase: "failed" }),
    );
    await act(async () => {
      await result.current.leaveForMessage();
    });
    expect(mocks.cancel).toHaveBeenCalledWith({
      threadUserIdx: 5971,
      sequence: 7,
    });
    expect(mocks.close).toHaveBeenCalledOnce();
    expect(onLeaveForMessage).toHaveBeenCalledWith(55);
  });

  it("그 사이 상담원이 연결됐으면 이동하지 않고 상담에 남는다", async () => {
    mocks.cancel.mockResolvedValue({ ok: false, reason: "connected" });
    const { result, onLeaveForMessage } = setup(
      inquiry({ realtimePhase: "failed" }),
    );
    await act(async () => {
      await result.current.leaveForMessage();
    });
    expect(mocks.close).not.toHaveBeenCalled();
    expect(onLeaveForMessage).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledOnce();
  });

  it("요청 정리가 실패해도 취소는 확정됐으니 이동한다", async () => {
    mocks.close.mockRejectedValue(new Error("rest"));
    const { result, onLeaveForMessage } = setup(
      inquiry({ realtimePhase: "failed" }),
    );
    await act(async () => {
      await result.current.leaveForMessage();
    });
    expect(onLeaveForMessage).toHaveBeenCalledWith(55);
  });

  it("요청 실패 상태에서 락을 가진 탭이 만료를 한 번만 기록한다", async () => {
    const { result, rerender } = setup(
      inquiry({ realtimePhase: "failed", connectDeadlineAt: 1000 }),
    );
    await waitFor(() => expect(result.current.lock).toBe("held"));
    await waitFor(() => expect(mocks.expire).toHaveBeenCalledOnce());
    rerender();
    expect(mocks.expire).toHaveBeenCalledOnce();
  });

  it("재시도는 같은 문의를 다시 요청한다", async () => {
    const { result } = setup(inquiry({ realtimePhase: "failed" }));
    await act(async () => {
      await result.current.retry();
    });
    expect(mocks.retry).toHaveBeenCalledWith(
      { threadUserIdx: 5971, sequence: 7 },
      expect.anything(),
    );
  });

  it("파일을 모두 올린 뒤 한 번의 저장으로 보내고, 실패해 다시 보내면 업로드와 messageId를 재사용한다", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.lock).toBe("held"));
    const files = [new File(["1"], "a.png"), new File(["2"], "b.png")];
    mocks.upload
      .mockResolvedValueOnce({
        url: "https://cdn/a.png",
        attachmentIdx: 9,
        fileName: "a.png",
        fileSize: 1,
      })
      .mockResolvedValueOnce({
        url: "https://cdn/b.png",
        attachmentIdx: 10,
        fileName: "b.png",
        fileSize: 1,
      });
    mocks.append.mockRejectedValueOnce(new Error("network"));
    await expect(result.current.sendFiles(files)).resolves.toBe(false);
    await expect(result.current.sendFiles(files)).resolves.toBe(true);
    expect(mocks.upload).toHaveBeenCalledTimes(2);
    expect(mocks.append).toHaveBeenCalledTimes(2);
    const first = mocks.append.mock.calls[0]![1].message;
    const second = mocks.append.mock.calls[1]![1].message;
    expect(second).toHaveLength(2);
    expect(second[0]).toMatchObject({
      auto: false,
      attachmentIdx: 9,
      body: "https://cdn/a.png",
      fileName: "a.png",
      fileType: "image",
      isUserMessage: true,
    });
    expect(second.map((m: { messageId: string }) => m.messageId)).toEqual(
      first.map((m: { messageId: string }) => m.messageId),
    );
  });

  it("업로드가 실패하면 저장하지 않고, 허용하지 않는 형식은 요청하지 않는다", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.lock).toBe("held"));
    mocks.upload.mockRejectedValueOnce(new Error("500"));
    await expect(
      result.current.sendFiles([new File(["x"], "a.png")]),
    ).resolves.toBe(false);
    expect(mocks.append).not.toHaveBeenCalled();
    await expect(
      result.current.sendFiles([new File(["x"], "a.gif")]),
    ).resolves.toBe(false);
    expect(mocks.upload).toHaveBeenCalledOnce();
  });
});
