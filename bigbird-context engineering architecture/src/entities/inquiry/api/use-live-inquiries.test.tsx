import { act, renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REALTIME_CONNECT_TIMEOUT_MS } from "../lib/realtime-phase";
import { useLiveInquiries } from "./use-live-inquiries";

import type { BigbirdInquiryViewModel } from "../model/schema";
import type { ReactNode } from "react";

const mocks = vi.hoisted(() => ({
  getFirestoreDb: vi.fn(async () => ({})),
  doc: vi.fn(() => ({})),
  onSnapshot: vi.fn(),
}));

vi.mock("@/shared/api", () => ({ getFirestoreDb: mocks.getFirestoreDb }));
vi.mock("firebase/firestore", () => ({
  doc: mocks.doc,
  onSnapshot: mocks.onSnapshot,
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>
  );
}

const requestedAt = new Date("2026-10-19T10:00:00");

function realtime(
  overrides: Partial<BigbirdInquiryViewModel> = {},
): BigbirdInquiryViewModel {
  return {
    threadIdx: 101,
    sequence: 7,
    campaignIdx: null,
    isRealtime: true,
    isFinished: false,
    status: "waiting",
    realtimePhase: null,
    createdAt: requestedAt,
    messages: [],
    ...overrides,
  };
}

function snapshotOf(isConnect: boolean, finishTime: string | null = null) {
  return {
    exists: () => true,
    data: () => ({
      sequence: 7,
      threadIdx: 101,
      isConnect,
      finishTime,
      messages: [],
    }),
  };
}

describe("useLiveInquiries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("종료되지 않은 실시간 상담만 구독하고, 일반 문의·종료된 상담은 구독하지 않는다", async () => {
    mocks.onSnapshot.mockReturnValue(vi.fn());
    renderHook(
      () =>
        useLiveInquiries(5971, [
          realtime(),
          realtime({ threadIdx: 102, sequence: 8, isRealtime: false }),
          realtime({ threadIdx: 103, sequence: 9, isFinished: true }),
        ]),
      { wrapper },
    );
    await waitFor(() => expect(mocks.onSnapshot).toHaveBeenCalledOnce());
    expect(mocks.doc).toHaveBeenCalledWith(
      expect.anything(),
      "helpdesk",
      "0.0.2",
      "threadUserIdx",
      "5971",
      "sequence",
      "7",
    );
  });

  it("운영자가 연결하면 상담 중으로 바꾼다", async () => {
    mocks.onSnapshot.mockImplementation((_ref, onNext) => {
      onNext(snapshotOf(true));
      return vi.fn();
    });
    const { result } = renderHook(() => useLiveInquiries(5971, [realtime()]), {
      wrapper,
    });
    await waitFor(() =>
      expect(result.current?.[0]).toMatchObject({
        status: "consulting",
        realtimePhase: "connected",
      }),
    );
  });

  it("연결 대기 5분이 지나면 요청 실패로 바꾼다", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    vi.setSystemTime(requestedAt.getTime() + 1000);
    mocks.onSnapshot.mockImplementation((_ref, onNext) => {
      onNext(snapshotOf(false));
      return vi.fn();
    });
    const { result } = renderHook(() => useLiveInquiries(5971, [realtime()]), {
      wrapper,
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current?.[0]?.realtimePhase).toBe("requesting");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(REALTIME_CONNECT_TIMEOUT_MS);
    });
    expect(result.current?.[0]).toMatchObject({
      status: "failed",
      realtimePhase: "failed",
    });
  });

  it("상태 문서를 아직 받지 못했으면 REST 상태를 그대로 둔다", () => {
    mocks.onSnapshot.mockReturnValue(vi.fn());
    const { result } = renderHook(() => useLiveInquiries(5971, [realtime()]), {
      wrapper,
    });
    expect(result.current?.[0]).toMatchObject({
      status: "waiting",
      realtimePhase: null,
    });
  });
});
