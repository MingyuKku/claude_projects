import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { acceptRealtimeRequest } from "@/entities/inquiry";

import { useAcceptRealtimeOnOpen } from "./useAcceptRealtimeOnOpen";

import type { BuyerInquiryViewModel } from "@/entities/inquiry";

vi.mock("@/entities/inquiry", () => ({ acceptRealtimeRequest: vi.fn() }));

const inquiry = { threadUserIdx: 5546 } as BuyerInquiryViewModel;
// 수락 기록이 모듈에 남으므로 테스트마다 다른 상담 번호를 씀.
let nextSequence = 1180;
let thread = { threadIdx: 10, sequence: nextSequence };

function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => hidden,
  });
}

describe("useAcceptRealtimeOnOpen", () => {
  beforeEach(() => {
    thread = { threadIdx: 10, sequence: nextSequence++ };
    setHidden(false);
    vi.mocked(acceptRealtimeRequest).mockReset();
    vi.mocked(acceptRealtimeRequest).mockResolvedValue({
      ok: true,
      skipped: false,
    });
  });
  afterEach(() => setHidden(false));

  it("열면 한 번만 수락하고 다시 렌더링하거나 다시 열어도 또 쓰지 않음", () => {
    const first = renderHook(() =>
      useAcceptRealtimeOnOpen(inquiry, thread, "adv"),
    );
    first.rerender();
    first.unmount();
    renderHook(() => useAcceptRealtimeOnOpen(inquiry, thread, "adv"));

    expect(acceptRealtimeRequest).toHaveBeenCalledExactlyOnceWith(
      { threadUserIdx: 5546, sequence: thread.sequence },
      "adv",
    );
  });

  it("진행 중인 실시간 상담이 없으면 수락하지 않음", () => {
    renderHook(() => useAcceptRealtimeOnOpen(inquiry, null, "adv"));
    expect(acceptRealtimeRequest).not.toHaveBeenCalled();
  });

  it("가려진 탭에서 열리면 보이게 될 때 수락함", () => {
    setHidden(true);
    renderHook(() => useAcceptRealtimeOnOpen(inquiry, thread, "adv"));
    expect(acceptRealtimeRequest).not.toHaveBeenCalled();

    setHidden(false);
    document.dispatchEvent(new Event("visibilitychange"));
    expect(acceptRealtimeRequest).toHaveBeenCalledOnce();
  });

  it("통신 오류면 다음에 보일 때 다시 시도함", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(acceptRealtimeRequest).mockRejectedValueOnce(new Error("net"));
    renderHook(() => useAcceptRealtimeOnOpen(inquiry, thread, "adv"));
    await waitFor(() => expect(error).toHaveBeenCalled());

    document.dispatchEvent(new Event("visibilitychange"));
    expect(acceptRealtimeRequest).toHaveBeenCalledTimes(2);
    error.mockRestore();
  });
});
