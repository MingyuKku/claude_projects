import { act, renderHook } from "@testing-library/react";

import { ApiError, serverApiV3 } from "@/shared/api";

import {
  formatKstDateTime,
  useInquiryUpdatePolling,
} from "./use-inquiry-updates";

import type { InquiryUpdateQuery } from "./use-inquiry-updates";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  serverApiV3: { get: vi.fn() },
}));

const query: InquiryUpdateQuery = {
  isInfluencerMenu: true,
  status: "ALL",
  sourceType: "ALL",
};

function answer(hasUpdates: boolean, checkedAt: string) {
  return { result: true, hasUpdates, checkedAt };
}

function setHidden(isHidden: boolean) {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => isHidden,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

function sinceOf(callIndex: number) {
  const config = vi.mocked(serverApiV3.get).mock.calls[callIndex]?.[1] as {
    params: { since: string };
  };
  return config.params.since;
}

function renderPolling(
  props: {
    listKey?: string;
    isLoaded?: boolean;
    query?: InquiryUpdateQuery;
  } = {},
  onUpdated = vi.fn(),
) {
  const hook = renderHook(
    (current: typeof props) =>
      useInquiryUpdatePolling(
        current.listKey ?? "key",
        current.isLoaded ?? true,
        current.query ?? query,
        onUpdated,
      ),
    { initialProps: props },
  );
  return { ...hook, onUpdated };
}

describe("formatKstDateTime", () => {
  it("PC 시간대와 상관없이 한국 시각 초 단위로 만든다", () => {
    expect(formatKstDateTime(Date.parse("2026-11-09T05:06:51Z"))).toBe(
      "2026-11-09 14:06:51",
    );
    expect(formatKstDateTime(Date.parse("2026-11-09T16:00:00Z"))).toBe(
      "2026-11-10 01:00:00",
    );
  });
});

describe("useInquiryUpdatePolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-09T05:00:00Z")); // 14:00:00 KST
    vi.clearAllMocks();
    setHidden(false);
  });
  afterEach(() => {
    vi.useRealTimers();
    setHidden(false);
  });

  it("10초마다 확인하고, 바뀐 게 없으면 목록을 다시 받지 않는다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValue(
      answer(false, "2026-11-09 14:00:10"),
    );
    const { onUpdated } = renderPolling();
    await advance(9_999);
    expect(serverApiV3.get).not.toHaveBeenCalled();
    await advance(1);
    expect(serverApiV3.get).toHaveBeenCalledTimes(1);
    await advance(10_000);
    expect(serverApiV3.get).toHaveBeenCalledTimes(2);
    expect(onUpdated).not.toHaveBeenCalled();
  });

  it("첫 since는 목록을 받은 시각 30초 전이고, 이후에는 응답의 checkedAt만 쓴다", async () => {
    vi.mocked(serverApiV3.get)
      .mockResolvedValueOnce(answer(false, "2026-11-09 14:00:10"))
      .mockResolvedValueOnce(answer(false, "2026-11-09 14:00:20"));
    renderPolling();
    await advance(10_000);
    await advance(10_000);
    expect(sinceOf(0)).toBe("2026-11-09 13:59:30");
    expect(sinceOf(1)).toBe("2026-11-09 14:00:10");
  });

  it("checkedAt이 초 단위 형식이 아니면 PC 시각 30초 전을 다음 since로 쓰고, 바뀐 게 있다는 응답은 그대로 반영한다", async () => {
    vi.mocked(serverApiV3.get)
      .mockResolvedValueOnce(answer(true, "2026-11-09 14:00")) // 분 단위
      .mockResolvedValueOnce(answer(false, "2026-11-09 14:00:20"));
    const { onUpdated } = renderPolling();
    await advance(10_000);
    expect(onUpdated).toHaveBeenCalledTimes(1);
    await advance(10_000);
    expect(sinceOf(1)).toBe("2026-11-09 13:59:40");
  });

  it("바뀐 게 있을 때만 목록 다시 받기를 부르고 인플루언서 전용 주소와 필터를 보낸다", async () => {
    vi.mocked(serverApiV3.get)
      .mockResolvedValueOnce(answer(false, "2026-11-09 14:00:10"))
      .mockResolvedValueOnce(answer(true, "2026-11-09 14:00:20"));
    const { onUpdated } = renderPolling({
      query: {
        ...query,
        status: "WAITING",
        sourceType: "CAMPAIGN_QNA",
        campaignIdx: 7,
        influencerThreadUserIdx: 9,
      },
    });
    await advance(10_000);
    expect(onUpdated).not.toHaveBeenCalled();
    await advance(10_000);
    expect(onUpdated).toHaveBeenCalledTimes(1);
    expect(serverApiV3.get).toHaveBeenLastCalledWith(
      "/help/influencer-inquiry/has-updates",
      {
        params: {
          since: "2026-11-09 14:00:10",
          status: "WAITING",
          sourceType: "CAMPAIGN_QNA",
          campaignIdx: 7,
          influencerThreadUserIdx: 9,
        },
      },
    );
  });

  it("구매자 메뉴는 통합 주소로 확인한다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValue(
      answer(false, "2026-11-09 14:00:10"),
    );
    renderPolling({ query: { ...query, isInfluencerMenu: false } });
    await advance(10_000);
    expect(serverApiV3.get).toHaveBeenCalledWith(
      "/help/inquiry/has-updates",
      expect.anything(),
    );
  });

  it("목록을 아직 받지 못했으면 확인하지 않고, 받은 뒤부터 시작한다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValue(
      answer(false, "2026-11-09 14:00:40"),
    );
    const { rerender } = renderPolling({ isLoaded: false });
    await advance(30_000);
    expect(serverApiV3.get).not.toHaveBeenCalled();
    rerender({ isLoaded: true });
    await advance(10_000);
    expect(serverApiV3.get).toHaveBeenCalledTimes(1);
    // 목록을 받은 시점(14:00:30) 기준 30초 전
    expect(sinceOf(0)).toBe("2026-11-09 14:00:00");
  });

  it("탭이 가려지면 멈추고, 다시 보이면 바로 한 번 확인한다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValue(
      answer(false, "2026-11-09 14:00:10"),
    );
    renderPolling();
    await advance(10_000);
    expect(serverApiV3.get).toHaveBeenCalledTimes(1);
    setHidden(true);
    await advance(60_000);
    expect(serverApiV3.get).toHaveBeenCalledTimes(1);
    await act(async () => setHidden(false));
    expect(serverApiV3.get).toHaveBeenCalledTimes(2);
    await advance(10_000);
    expect(serverApiV3.get).toHaveBeenCalledTimes(3);
  });

  it("탭·필터가 바뀌면 처음부터 다시 시작해 since를 새로 잡는다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValue(
      answer(false, "2026-11-09 14:00:10"),
    );
    const { rerender } = renderPolling({ listKey: "all" });
    await advance(10_000);
    expect(sinceOf(0)).toBe("2026-11-09 13:59:30");
    await advance(5_000);
    rerender({ listKey: "waiting" });
    // 바꾼 시점(14:00:15) 기준으로 10초 뒤에 첫 확인, since는 그 30초 전
    await advance(9_999);
    expect(serverApiV3.get).toHaveBeenCalledTimes(1);
    await advance(1);
    expect(serverApiV3.get).toHaveBeenCalledTimes(2);
    expect(sinceOf(1)).toBe("2026-11-09 13:59:45");
  });

  it("확인이 실패해도 안내 없이 같은 since로 다음 주기에 다시 시도한다", async () => {
    vi.mocked(serverApiV3.get)
      .mockRejectedValueOnce(new ApiError(500, null))
      .mockResolvedValueOnce(answer(true, "2026-11-09 14:00:20"));
    const { onUpdated } = renderPolling();
    await advance(10_000);
    expect(onUpdated).not.toHaveBeenCalled();
    await advance(10_000);
    expect(onUpdated).toHaveBeenCalledTimes(1);
    expect(sinceOf(1)).toBe(sinceOf(0));
  });

  it("권한이 없으면(403) 그 뒤로는 확인하지 않는다", async () => {
    vi.mocked(serverApiV3.get).mockRejectedValue(new ApiError(403, null));
    const { onUpdated } = renderPolling();
    await advance(10_000);
    expect(serverApiV3.get).toHaveBeenCalledTimes(1);
    await advance(60_000);
    await act(async () => setHidden(true));
    await act(async () => setHidden(false));
    expect(serverApiV3.get).toHaveBeenCalledTimes(1);
    expect(onUpdated).not.toHaveBeenCalled();
  });

  it("화면을 떠나면 확인을 멈추고 늦게 온 응답도 무시한다", async () => {
    let resolveCheck: (value: unknown) => void = () => {};
    vi.mocked(serverApiV3.get).mockImplementation(
      () => new Promise((resolve) => (resolveCheck = resolve)),
    );
    const { unmount, onUpdated } = renderPolling();
    await advance(10_000);
    unmount();
    await act(async () => resolveCheck(answer(true, "2026-11-09 14:00:10")));
    await advance(60_000);
    expect(serverApiV3.get).toHaveBeenCalledTimes(1);
    expect(onUpdated).not.toHaveBeenCalled();
  });
});
