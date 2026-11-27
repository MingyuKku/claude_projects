import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { SWRConfig } from "swr";

import { resetListSync } from "@/shared/lib";

import { fetchChargeList } from "./charge-api";
import { fetchUsageList } from "./usage-api";
import {
  useChargeScrollList,
  useReloadChargeHistory,
} from "./use-charge-history";
import { useRevalidateHistoryOnReturn } from "./use-history-sync";
import { useUsageScrollList } from "./use-usage-history";

import type { ChargeListViewModel } from "../model/charge-types";
import type { UsageListViewModel } from "../model/usage-types";
import type { ReactNode } from "react";

vi.mock("./charge-api", () => ({ fetchChargeList: vi.fn() }));
vi.mock("./usage-api", () => ({ fetchUsageList: vi.fn() }));

// 두 쪽짜리 목록. 레코드 내용은 다시 읽기 횟수만 보므로 비워 둠.
function chargePage(page: number): ChargeListViewModel {
  return { records: [], totalCount: 20, page, totalPages: 2 };
}

function usagePage(page: number): UsageListViewModel {
  return { records: [], totalCount: 20, page, totalPages: 2 };
}

const chargeQuery = { entrySize: 10 };
const usageQuery = { entrySize: 10 } as Parameters<
  typeof useUsageScrollList
>[0];

function ChargeList() {
  const list = useChargeScrollList(chargeQuery, true);
  return (
    <button type="button" onClick={list.loadMore}>
      {list.hasMore ? "more" : list.hasData ? "all" : "loading"}
    </button>
  );
}

// 빅버드 머니 화면. `isListShown`이 거짓이면 MO에서 상세를 연 것처럼 목록만 내림.
function MoneyPage({ isListShown = true }: { isListShown?: boolean }) {
  useRevalidateHistoryOnReturn();
  const reloadCharge = useReloadChargeHistory();
  return (
    <>
      <button type="button" onClick={() => void reloadCharge()}>
        reload
      </button>
      {isListShown ? <ChargeList /> : <p>detail</p>}
    </>
  );
}

// 화면을 떠났다 돌아와도 같은 캐시를 보게 함(라우터는 목록 조건을 주소에서 읽는 훅용). 중복 요청 합치기를 꺼서 다시 읽는지만 드러나게 함.
function createWrapper() {
  const cache = new Map();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SWRConfig value={{ provider: () => cache, dedupingInterval: 0 }}>
        <MemoryRouter>{children}</MemoryRouter>
      </SWRConfig>
    );
  };
}

// 첫 쪽을 읽고 스크롤 끝에서 둘째 쪽까지 이어 읽은 상태를 만듦.
async function loadTwoPages() {
  await userEvent.click(await screen.findByText("more"));
  await screen.findByText("all");
  expect(fetchChargeList).toHaveBeenCalledTimes(2);
  vi.mocked(fetchChargeList).mockClear();
}

describe("빅버드 머니 MO 내역 다시 읽기", () => {
  beforeEach(() => {
    resetListSync();
    vi.mocked(fetchChargeList).mockImplementation(({ page }) =>
      Promise.resolve(chargePage(page)),
    );
    vi.mocked(fetchUsageList).mockImplementation(({ page }) =>
      Promise.resolve(usagePage(page)),
    );
  });
  afterEach(() => {
    vi.mocked(fetchChargeList).mockReset();
    vi.mocked(fetchUsageList).mockReset();
  });

  it("처음 보이면 쪽마다 한 번만 읽는다", async () => {
    render(<MoneyPage />, { wrapper: createWrapper() });
    await loadTwoPages();

    await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
    expect(fetchChargeList).not.toHaveBeenCalled();
  });

  it("화면을 떠났다 다시 들어오면 캐시를 보인 채 읽어 둔 쪽을 모두 다시 읽는다", async () => {
    const wrapper = createWrapper();
    const first = render(<MoneyPage />, { wrapper });
    await loadTwoPages();
    first.unmount();

    render(<MoneyPage />, { wrapper });

    expect(screen.getByText("all")).toBeInTheDocument();
    await waitFor(() => expect(fetchChargeList).toHaveBeenCalledTimes(2));
    expect(vi.mocked(fetchChargeList).mock.calls.map(([q]) => q.page)).toEqual([
      1, 2,
    ]);
  });

  it("화면 안에서 상세를 열고 닫아 목록이 다시 그려지면 다시 읽지 않는다", async () => {
    const { rerender } = render(<MoneyPage />, { wrapper: createWrapper() });
    await loadTwoPages();

    rerender(<MoneyPage isListShown={false} />);
    rerender(<MoneyPage />);

    expect(screen.getByText("all")).toBeInTheDocument();
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
    expect(fetchChargeList).not.toHaveBeenCalled();
  });

  it("useReloadChargeHistory를 부르면 보이는 목록이 읽어 둔 쪽을 모두 다시 읽는다(포커스·대기 중 주기·출금 뒤)", async () => {
    render(<MoneyPage />, { wrapper: createWrapper() });
    await loadTwoPages();

    await userEvent.click(screen.getByText("reload"));

    await waitFor(() => expect(fetchChargeList).toHaveBeenCalledTimes(2));
  });

  it("목록이 내려가 있는 동안 다시 읽기를 부르면 다음에 보일 때 읽는다", async () => {
    const { rerender } = render(<MoneyPage />, { wrapper: createWrapper() });
    await loadTwoPages();
    rerender(<MoneyPage isListShown={false} />);

    await userEvent.click(screen.getByText("reload"));
    expect(fetchChargeList).not.toHaveBeenCalled();

    rerender(<MoneyPage />);
    await waitFor(() => expect(fetchChargeList).toHaveBeenCalledTimes(2));
  });

  it("사용 내역도 화면에 다시 들어오면 읽어 둔 쪽을 다시 읽고, 충전 다시 읽기에는 따라 읽지 않는다", async () => {
    const wrapper = createWrapper();
    const page = renderHook(
      () => {
        useRevalidateHistoryOnReturn();
        return {
          usage: useUsageScrollList(usageQuery, true),
          reload: useReloadChargeHistory(),
        };
      },
      { wrapper },
    );
    await waitFor(() => expect(page.result.current.usage.hasData).toBe(true));
    vi.mocked(fetchUsageList).mockClear();

    await act(async () => {
      await page.result.current.reload();
    });
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
    expect(fetchUsageList).not.toHaveBeenCalled();

    page.unmount();
    renderHook(() => useUsageScrollList(usageQuery, true), { wrapper });
    await waitFor(() => expect(fetchUsageList).toHaveBeenCalledTimes(1));
  });
});
