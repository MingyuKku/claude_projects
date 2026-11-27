import { act, renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";

import { resetListSync } from "@/shared/lib";

import { fetchUsageFilterOptions } from "./usage-api";
import { useRevalidateHistoryOnReturn } from "./use-history-sync";
import { useUsageFilterOptions } from "./use-usage-filter-options";

import type { ReactNode } from "react";

vi.mock("./usage-api", () => ({ fetchUsageFilterOptions: vi.fn() }));

// 다시 그려져도 같은 캐시를 보게 함. 중복 요청 합치기를 꺼서 다시 읽는지만 드러나게 함.
function createWrapper() {
  const cache = new Map();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SWRConfig value={{ provider: () => cache, dedupingInterval: 0 }}>
        {children}
      </SWRConfig>
    );
  };
}

function waitTick() {
  return act(() => new Promise((resolve) => setTimeout(resolve, 20)));
}

describe("useUsageFilterOptions", () => {
  beforeEach(() => {
    resetListSync();
    vi.mocked(fetchUsageFilterOptions).mockResolvedValue({
      campaigns: [],
      usageDetails: [],
    });
  });
  afterEach(() => {
    vi.mocked(fetchUsageFilterOptions).mockReset();
  });

  it("화면 안에서 다시 그려지면(TAB·MO 상세를 닫을 때) 다시 읽지 않는다", async () => {
    const wrapper = createWrapper();
    const first = renderHook(() => useUsageFilterOptions(), { wrapper });
    await waitFor(() => expect(first.result.current.isLoading).toBe(false));
    first.unmount();

    renderHook(() => useUsageFilterOptions(), { wrapper });

    await waitTick();
    expect(fetchUsageFilterOptions).toHaveBeenCalledTimes(1);
  });

  it("빅버드 머니 화면에 다시 들어오면 한 번 다시 읽는다", async () => {
    const wrapper = createWrapper();
    const useMoneyPage = () => {
      useRevalidateHistoryOnReturn();
      return useUsageFilterOptions();
    };
    const first = renderHook(useMoneyPage, { wrapper });
    await waitFor(() => expect(first.result.current.isLoading).toBe(false));
    first.unmount();

    renderHook(useMoneyPage, { wrapper });

    await waitFor(() =>
      expect(fetchUsageFilterOptions).toHaveBeenCalledTimes(2),
    );
    await waitTick();
    expect(fetchUsageFilterOptions).toHaveBeenCalledTimes(2);
  });
});
