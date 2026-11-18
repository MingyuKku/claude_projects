import { act, renderHook } from "@testing-library/react";

import { useRefreshBigbirdMoneyBalance } from "@/entities/bigbird-money";

import { useReloadChargeHistory } from "../api/use-charge-history";
import {
  CHARGE_FOCUS_REFRESH_THROTTLE_MS,
  CHARGE_PENDING_REFRESH_INTERVAL_MS,
} from "../model/constants";
import { useChargeAutoRefresh } from "./use-charge-auto-refresh";

import type { ChargeRecord } from "../model/charge-types";

vi.mock("../api/use-charge-history", () => ({
  useReloadChargeHistory: vi.fn(),
}));
vi.mock("@/entities/bigbird-money", () => ({
  useRefreshBigbirdMoneyBalance: vi.fn(),
}));

const reloadHistory = vi.fn();
const refreshBalance = vi.fn();

function record(status: ChargeRecord["status"]) {
  return { status } as ChargeRecord;
}

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: state,
  });
}

describe("useChargeAutoRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility("visible");
    reloadHistory.mockResolvedValue([]);
    refreshBalance.mockResolvedValue(undefined);
    vi.mocked(useReloadChargeHistory).mockReturnValue(reloadHistory);
    vi.mocked(useRefreshBigbirdMoneyBalance).mockReturnValue(refreshBalance);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("대기 중 건이 보이면 간격마다 내역과 잔액을 함께 다시 읽는다", () => {
    renderHook(() => useChargeAutoRefresh([record("pending")]));

    act(() => vi.advanceTimersByTime(CHARGE_PENDING_REFRESH_INTERVAL_MS));

    expect(reloadHistory).toHaveBeenCalledTimes(1);
    expect(refreshBalance).toHaveBeenCalledTimes(1);
  });

  it("대기 중 건이 없으면 주기적으로 읽지 않는다", () => {
    renderHook(() => useChargeAutoRefresh([record("paid")]));

    act(() => vi.advanceTimersByTime(CHARGE_PENDING_REFRESH_INTERVAL_MS * 3));

    expect(reloadHistory).not.toHaveBeenCalled();
  });

  it("탭이 숨겨진 동안에는 주기적으로 읽지 않는다", () => {
    setVisibility("hidden");
    renderHook(() => useChargeAutoRefresh([record("pending")]));

    act(() => vi.advanceTimersByTime(CHARGE_PENDING_REFRESH_INTERVAL_MS));

    expect(reloadHistory).not.toHaveBeenCalled();
  });

  it("대기 중 건이 사라지면 주기적 읽기를 멈춘다", () => {
    const { rerender } = renderHook(
      ({ records }) => useChargeAutoRefresh(records),
      { initialProps: { records: [record("pending")] } },
    );
    rerender({ records: [record("paid")] });

    act(() => vi.advanceTimersByTime(CHARGE_PENDING_REFRESH_INTERVAL_MS * 2));

    expect(reloadHistory).not.toHaveBeenCalled();
  });

  it("창이 포커스를 되찾으면 대기 건이 없어도 읽고, 연달아 오는 이벤트는 한 번만 읽는다", () => {
    renderHook(() => useChargeAutoRefresh([record("paid")]));
    vi.setSystemTime(Date.now() + CHARGE_FOCUS_REFRESH_THROTTLE_MS);

    act(() => {
      window.dispatchEvent(new Event("focus"));
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(reloadHistory).toHaveBeenCalledTimes(1);
    expect(refreshBalance).toHaveBeenCalledTimes(1);
  });
});
