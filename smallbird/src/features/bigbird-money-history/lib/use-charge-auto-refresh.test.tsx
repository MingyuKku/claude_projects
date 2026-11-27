import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";

import { useRefreshBigbirdMoneyBalance } from "@/entities/bigbird-money";
import { resetListSync } from "@/shared/lib";

import { fetchChargeList } from "../api/charge-api";
import { useChargeScrollList } from "../api/use-charge-history";
import {
  CHARGE_FOCUS_REFRESH_THROTTLE_MS,
  CHARGE_PENDING_REFRESH_INTERVAL_MS,
} from "../model/constants";
import { useChargeAutoRefresh } from "./use-charge-auto-refresh";

import type { ChargeListViewModel, ChargeRecord } from "../model/charge-types";
import type * as BigbirdMoney from "@/entities/bigbird-money";

vi.mock("../api/charge-api", () => ({ fetchChargeList: vi.fn() }));
vi.mock("@/entities/bigbird-money", async (importOriginal) => ({
  ...(await importOriginal<typeof BigbirdMoney>()),
  useRefreshBigbirdMoneyBalance: vi.fn(),
}));

const refreshBalance = vi.fn();

// 다시 읽기는 상태만 보므로 레코드는 상태만 채움.
function pageOf(
  page: number,
  status: ChargeRecord["status"],
  totalPages = 1,
): ChargeListViewModel {
  return {
    records: [{ id: `charge-${page}`, status } as ChargeRecord],
    totalCount: totalPages,
    page,
    totalPages,
  };
}

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: state,
  });
}

// MO 충전/출금 목록처럼 이어 읽는 목록의 레코드로 자동 갱신을 붙임.
function ChargeList() {
  const list = useChargeScrollList({ entrySize: 10 }, true);
  useChargeAutoRefresh(list.records);
  return (
    <>
      <button type="button" onClick={list.loadMore}>
        {list.hasMore ? "more" : list.hasData ? "all" : "loading"}
      </button>
      <p>{list.records.map((record) => record.status).join(",")}</p>
    </>
  );
}

// 중복 요청 합치기를 꺼서 다시 읽는지만 드러나게 함.
async function renderList() {
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <ChargeList />
    </SWRConfig>,
  );
  await screen.findByText("all");
  vi.mocked(fetchChargeList).mockClear();
}

// SWR의 요청 처리는 실제 타이머로 두고, 주기·간격 판단에 쓰는 것만 가짜로 돌림.
function fakeRefreshTimers() {
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
}

describe("useChargeAutoRefresh", () => {
  beforeEach(() => {
    resetListSync();
    setVisibility("visible");
    refreshBalance.mockResolvedValue(undefined);
    vi.mocked(useRefreshBigbirdMoneyBalance).mockReturnValue(refreshBalance);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.mocked(fetchChargeList).mockReset();
  });

  it("대기 중 건이 보이면 간격마다 내역과 잔액을 함께 다시 읽는다", async () => {
    fakeRefreshTimers();
    vi.mocked(fetchChargeList).mockResolvedValue(pageOf(1, "pending"));
    await renderList();

    act(() => vi.advanceTimersByTime(CHARGE_PENDING_REFRESH_INTERVAL_MS));
    vi.useRealTimers();

    await waitFor(() => expect(fetchChargeList).toHaveBeenCalledTimes(1));
    expect(refreshBalance).toHaveBeenCalledTimes(1);
  });

  it("대기 중 건이 없으면 주기적으로 읽지 않는다", async () => {
    fakeRefreshTimers();
    vi.mocked(fetchChargeList).mockResolvedValue(pageOf(1, "paid"));
    await renderList();

    act(() => vi.advanceTimersByTime(CHARGE_PENDING_REFRESH_INTERVAL_MS * 3));

    expect(fetchChargeList).not.toHaveBeenCalled();
    expect(refreshBalance).not.toHaveBeenCalled();
  });

  it("탭이 숨겨진 동안에는 주기적으로 읽지 않는다", async () => {
    fakeRefreshTimers();
    vi.mocked(fetchChargeList).mockResolvedValue(pageOf(1, "pending"));
    await renderList();
    setVisibility("hidden");

    act(() => vi.advanceTimersByTime(CHARGE_PENDING_REFRESH_INTERVAL_MS));

    expect(fetchChargeList).not.toHaveBeenCalled();
  });

  it("다시 읽어 대기 중 건이 사라지면 주기적 읽기를 멈춘다", async () => {
    fakeRefreshTimers();
    vi.mocked(fetchChargeList).mockResolvedValue(pageOf(1, "pending"));
    await renderList();
    vi.mocked(fetchChargeList).mockResolvedValue(pageOf(1, "paid"));

    act(() => vi.advanceTimersByTime(CHARGE_PENDING_REFRESH_INTERVAL_MS));
    await screen.findByText("paid");
    expect(fetchChargeList).toHaveBeenCalledTimes(1);

    act(() => vi.advanceTimersByTime(CHARGE_PENDING_REFRESH_INTERVAL_MS * 2));
    expect(fetchChargeList).toHaveBeenCalledTimes(1);
  });

  it("창이 포커스를 되찾으면 대기 건이 없어도 이어 읽은 쪽을 모두 읽고, 연달아 오는 이벤트는 한 번만 읽는다", async () => {
    vi.mocked(fetchChargeList).mockImplementation(({ page }) =>
      Promise.resolve(pageOf(page, "paid", 2)),
    );
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <ChargeList />
      </SWRConfig>,
    );
    await userEvent.click(await screen.findByText("more"));
    await screen.findByText("all");
    vi.mocked(fetchChargeList).mockClear();
    fakeRefreshTimers();
    vi.setSystemTime(Date.now() + CHARGE_FOCUS_REFRESH_THROTTLE_MS);

    act(() => {
      window.dispatchEvent(new Event("focus"));
      document.dispatchEvent(new Event("visibilitychange"));
    });
    // waitFor의 주기 확인이 가짜 setInterval에 묶이지 않게 되돌림.
    vi.useRealTimers();

    await waitFor(() => expect(fetchChargeList).toHaveBeenCalledTimes(2));
    expect(vi.mocked(fetchChargeList).mock.calls.map(([q]) => q.page)).toEqual([
      1, 2,
    ]);
    expect(refreshBalance).toHaveBeenCalledTimes(1);
  });
});
