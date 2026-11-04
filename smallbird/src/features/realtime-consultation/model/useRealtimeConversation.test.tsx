import { act, renderHook, waitFor } from "@testing-library/react";

import { useRealtimeConversation } from "./useRealtimeConversation";

import type { BigbirdInquiryViewModel } from "@/entities/inquiry";

const mocks = vi.hoisted(() => ({
  acquire: vi.fn(),
  release: vi.fn(),
  send: vi.fn(),
  closeRest: vi.fn(),
  upload: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/entities/inquiry", () => ({
  acquireConsultationLock: mocks.acquire,
  closeBigbirdInquiry: mocks.closeRest,
  isOtherDeviceError: (error: { status?: number }) => error?.status === 409,
  getAttachmentKind: (file: { name: string }) =>
    /\.(png|jpg)$/i.test(file.name) ? "image" : null,
  LOCK_REFRESH_MS: 15_000,
  REALTIME_IDLE_LIMIT_MS: 10 * 60_000,
  REALTIME_IDLE_WARNING_MS: 5 * 60_000,
  releaseConsultationLock: mocks.release,
  sendInquiryMessage: mocks.send,
  TAB_ID: "tab-1",
  uploadInquiryAttachment: mocks.upload,
}));
vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}));

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
  const hook = renderHook(() =>
    useRealtimeConversation({
      inquiry: value ?? undefined,
      session,
      enabled,
      onChanged,
    }),
  );
  return { ...hook, onChanged };
}

describe("useRealtimeConversation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquire.mockResolvedValue({ ok: true, skipped: false });
    mocks.release.mockResolvedValue({ ok: true, skipped: false });
    mocks.send.mockResolvedValue(101);
    mocks.closeRest.mockResolvedValue(undefined);
    mocks.upload.mockResolvedValue({
      url: "https://cdn/a.png",
      attachmentIdx: 9,
      fileName: "a.png",
      fileSize: 1,
    });
  });

  it("쓰기를 끄면 락을 잡지 않는다", () => {
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

  it("광고주 차례가 5분이면 안내하고, 10분이면 상담을 끝내고 종료를 알린다", async () => {
    vi.useFakeTimers();
    try {
      const since = Date.now();
      const { result } = setup(
        inquiry({ idleTurn: { waitingFor: "advertiser", since } }),
      );
      // 락을 얻은 뒤에 타이머가 걸림.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5 * 60_000);
      });
      expect(result.current.idleAlert).toBe("advertiserWarning");
      expect(mocks.closeRest).not.toHaveBeenCalled();
      act(() => result.current.dismissIdleAlert());
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5 * 60_000);
      });
      expect(result.current.idleAlert).toBe("advertiserClosed");
      expect(mocks.closeRest).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it("운영 차례가 5분이면 안내만, 10분이면 실시간을 끝내 일반 문의로 돌린다", async () => {
    vi.useFakeTimers();
    try {
      const since = Date.now();
      const { result } = setup(
        inquiry({ idleTurn: { waitingFor: "operator", since } }),
      );
      // 락을 얻은 뒤에 타이머가 걸림.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5 * 60_000);
      });
      expect(result.current.idleAlert).toBe("operatorDelay");
      expect(mocks.closeRest).not.toHaveBeenCalled();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5 * 60_000);
      });
      expect(result.current.idleAlert).toBe("operatorUnavailable");
      expect(mocks.closeRest).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it("5분 안내에서 취소하면 상담을 끝낸다", async () => {
    vi.useFakeTimers();
    try {
      const { result } = setup(
        inquiry({ idleTurn: { waitingFor: "operator", since: Date.now() } }),
      );
      // 락을 얻은 뒤에 타이머가 걸림.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5 * 60_000);
      });
      await act(async () => {
        result.current.endFromIdleAlert();
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(result.current.idleAlert).toBeNull();
      expect(mocks.closeRest).toHaveBeenCalledOnce();
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

  it("요청 중이던 상담이 연결되는 순간 연결 토스트를 한 번 띄운다", () => {
    let value = inquiry({ realtimePhase: "requesting" });
    const { rerender } = renderHook(() =>
      useRealtimeConversation({
        inquiry: value,
        session,
        enabled: true,
        onChanged: vi.fn(),
      }),
    );
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    value = inquiry({ realtimePhase: "connected" });
    rerender();
    rerender();
    expect(mocks.toastSuccess).toHaveBeenCalledExactlyOnceWith(
      "실시간 문의가 연결되었습니다.",
    );
  });

  it("이미 연결된 상담을 열 때는 연결 토스트를 띄우지 않는다", () => {
    setup(inquiry({ realtimePhase: "connected" }));
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });

  it("텍스트는 REST 메시지 API로 그 스레드에 보낸다", async () => {
    const { result } = setup();
    await act(async () => {
      expect(await result.current.send(" 안녕하세요 ")).toBe(true);
    });
    expect(mocks.send).toHaveBeenCalledWith({
      threadIdx: 101,
      body: "안녕하세요",
    });
  });

  it("전송이 실패하면 입력을 지키기 위해 false를 돌려주고 안내를 띄운다", async () => {
    mocks.send.mockRejectedValue(new Error("network"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = setup();
    await act(async () => {
      expect(await result.current.send("x")).toBe(false);
    });
    expect(mocks.toastError).toHaveBeenCalledOnce();
  });

  it("종료는 REST 종료만 부르고 끝나면 목록을 갱신한다", async () => {
    const { result, onChanged } = setup();
    await act(async () => {
      expect(await result.current.end()).toBe(true);
    });
    expect(mocks.closeRest).toHaveBeenCalledWith(101);
    expect(onChanged).toHaveBeenCalledOnce();
  });

  it("종료 중 오류가 나면 안내하고 목록은 건드리지 않는다", async () => {
    mocks.closeRest.mockRejectedValue(new Error("rest"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result, onChanged } = setup();
    await act(async () => {
      expect(await result.current.end()).toBe(false);
    });
    expect(mocks.toastError).toHaveBeenCalled();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it("파일을 올려 첨부 메시지로 보내고, 실패해 다시 보내면 이미 올린 파일은 다시 올리지 않는다", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.lock).toBe("held"));
    const files = [new File(["1"], "a.png")];
    mocks.send.mockRejectedValueOnce(new Error("network"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(result.current.sendFiles(files)).resolves.toBe(false);
    await expect(result.current.sendFiles(files)).resolves.toBe(true);
    expect(mocks.upload).toHaveBeenCalledOnce();
    expect(mocks.send).toHaveBeenLastCalledWith({
      threadIdx: 101,
      body: "https://cdn/a.png",
      attachmentIdx: 9,
    });
  });

  it("여러 파일 중간에 실패해 다시 보내면 이미 보낸 첨부는 건너뛰고 남은 것만 보낸다", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.lock).toBe("held"));
    const files = [new File(["1"], "a.png"), new File(["2"], "b.png")];
    mocks.upload
      .mockResolvedValueOnce({ url: "https://cdn/a.png", attachmentIdx: 1 })
      .mockResolvedValueOnce({ url: "https://cdn/b.png", attachmentIdx: 2 });
    mocks.send.mockClear();
    mocks.send
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("network"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(result.current.sendFiles(files)).resolves.toBe(false);
    await expect(result.current.sendFiles(files)).resolves.toBe(true);
    const bodies = mocks.send.mock.calls.map(
      ([arg]) => (arg as { body: string }).body,
    );
    expect(bodies).toEqual([
      "https://cdn/a.png",
      "https://cdn/b.png",
      "https://cdn/b.png",
    ]);
  });

  it("업로드가 실패하면 저장하지 않고, 허용하지 않는 형식은 요청하지 않는다", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.lock).toBe("held"));
    mocks.upload.mockRejectedValueOnce(new Error("500"));
    await expect(
      result.current.sendFiles([new File(["x"], "a.png")]),
    ).resolves.toBe(false);
    expect(mocks.send).not.toHaveBeenCalled();
    await expect(
      result.current.sendFiles([new File(["x"], "a.gif")]),
    ).resolves.toBe(false);
    expect(mocks.upload).toHaveBeenCalledOnce();
  });
});
