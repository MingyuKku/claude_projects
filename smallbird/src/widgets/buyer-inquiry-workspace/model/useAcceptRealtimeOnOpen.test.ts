import { renderHook, waitFor } from "@testing-library/react";

import { serverApiV3 } from "@/shared/api";

import { useAcceptRealtimeOnOpen } from "./useAcceptRealtimeOnOpen";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  serverApiV3: { put: vi.fn() },
}));

// 수락 기록이 모듈에 남으므로 테스트마다 다른 문의 번호를 씀.
let nextIdx = 100;

function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => hidden,
  });
}

describe("useAcceptRealtimeOnOpen", () => {
  beforeEach(() => {
    setHidden(false);
    vi.mocked(serverApiV3.put).mockReset();
    vi.mocked(serverApiV3.put).mockResolvedValue({ result: true });
  });

  afterEach(() => setHidden(false));

  it("진행 중인 실시간 상담을 열면 수락 API를 한 번만 부른다", () => {
    const idx = nextIdx++;
    const { rerender } = renderHook(() => useAcceptRealtimeOnOpen(idx));
    rerender();
    renderHook(() => useAcceptRealtimeOnOpen(idx));
    expect(serverApiV3.put).toHaveBeenCalledExactlyOnceWith(
      `/help/inquiry/${idx}/realtime/accept`,
      undefined,
      { headers: { "X-Device-Id": expect.any(String) } },
    );
  });

  it("수락에 성공한 문의는 탭에 기록하고, 기록된 문의는 새로고침 뒤에도 다시 보내지 않는다", async () => {
    const idx = nextIdx++;
    renderHook(() => useAcceptRealtimeOnOpen(idx));
    await waitFor(() =>
      expect(
        JSON.parse(sessionStorage.getItem("bigbird.acceptedRealtime") ?? "[]"),
      ).toContain(idx),
    );
    // 새로고침으로 페이지 기록이 비어도 탭 기록이 남아 있으면 보내지 않음
    const reloaded = nextIdx++;
    sessionStorage.setItem(
      "bigbird.acceptedRealtime",
      JSON.stringify([reloaded]),
    );
    vi.mocked(serverApiV3.put).mockClear();
    renderHook(() => useAcceptRealtimeOnOpen(reloaded));
    expect(serverApiV3.put).not.toHaveBeenCalled();
  });

  it("진행 중인 실시간 상담이 없으면 부르지 않는다", () => {
    renderHook(() => useAcceptRealtimeOnOpen(null));
    expect(serverApiV3.put).not.toHaveBeenCalled();
  });

  it("탭이 가려진 채 열리면 보이게 될 때 수락한다", () => {
    setHidden(true);
    renderHook(() => useAcceptRealtimeOnOpen(nextIdx++));
    expect(serverApiV3.put).not.toHaveBeenCalled();
    setHidden(false);
    document.dispatchEvent(new Event("visibilitychange"));
    expect(serverApiV3.put).toHaveBeenCalledOnce();
  });

  it("실패하면 다음에 탭이 보일 때 다시 시도한다", async () => {
    vi.mocked(serverApiV3.put).mockRejectedValueOnce(new Error("net"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderHook(() => useAcceptRealtimeOnOpen(nextIdx++));
    await waitFor(() => expect(console.error).toHaveBeenCalled());
    document.dispatchEvent(new Event("visibilitychange"));
    expect(serverApiV3.put).toHaveBeenCalledTimes(2);
  });
});
