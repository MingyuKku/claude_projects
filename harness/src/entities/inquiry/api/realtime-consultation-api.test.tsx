import { renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRealtimeConsultationMessages } from "./realtime-consultation-api";

import type { ReactNode } from "react";

const mocks = vi.hoisted(() => ({
  getFirestoreDb: vi.fn(async () => ({})),
  doc: vi.fn(() => ({})),
  onSnapshot: vi.fn(() => vi.fn()),
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

describe("useRealtimeConsultationMessages", () => {
  beforeEach(() => vi.clearAllMocks());

  it("선택한 상담 문서만 구독하고 화면을 떠날 때 구독을 해제한다", async () => {
    const unsubscribe = vi.fn();
    mocks.onSnapshot.mockReturnValue(unsubscribe);
    const { unmount } = renderHook(
      () => useRealtimeConsultationMessages(5971, 7, 101),
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
    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it("일반 문의는 Firestore를 구독하지 않는다", () => {
    renderHook(() => useRealtimeConsultationMessages(5971, undefined, 101), {
      wrapper,
    });
    expect(mocks.getFirestoreDb).not.toHaveBeenCalled();
  });
});
