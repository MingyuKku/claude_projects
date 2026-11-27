import { act, renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";

import { resetListSync } from "@/shared/lib";

import { fetchSubscriptionPayments } from "./subscription-api";
import {
  usePaymentScrollList,
  useRevalidatePaymentsOnReturn,
  useRevalidateSubscriptionData,
} from "./use-subscription-data";

import type { PaymentList } from "../model/types";
import type { ReactNode } from "react";

vi.mock("./subscription-api", () => ({ fetchSubscriptionPayments: vi.fn() }));

// 15건을 10건씩 두 쪽으로 받음. 레코드 내용은 요청 횟수만 보므로 비워 둠.
const TOTAL_COUNT = 15;
const baseQuery = { size: 10 };

function paymentPage(): PaymentList {
  return { totalCount: TOTAL_COUNT, records: [] };
}

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

function useSubscribePage() {
  useRevalidatePaymentsOnReturn();
  return {
    list: usePaymentScrollList(baseQuery, true),
    revalidate: useRevalidateSubscriptionData(),
  };
}

async function loadTwoPages(result: {
  current: ReturnType<typeof useSubscribePage>;
}) {
  await waitFor(() => expect(result.current.list.hasMore).toBe(true));
  act(() => result.current.list.loadMore());
  await waitFor(() => expect(result.current.list.hasMore).toBe(false));
  expect(fetchSubscriptionPayments).toHaveBeenCalledTimes(2);
  vi.mocked(fetchSubscriptionPayments).mockClear();
}

describe("usePaymentScrollList", () => {
  beforeEach(() => {
    resetListSync();
    vi.mocked(fetchSubscriptionPayments).mockImplementation(() =>
      Promise.resolve(paymentPage()),
    );
  });
  afterEach(() => {
    vi.mocked(fetchSubscriptionPayments).mockReset();
  });

  it("건수로 쪽 수를 세어 마지막 쪽까지 쪽 번호를 붙여 이어 읽는다", async () => {
    const page = renderHook(useSubscribePage, { wrapper: createWrapper() });
    await waitFor(() => expect(page.result.current.list.hasMore).toBe(true));
    act(() => page.result.current.list.loadMore());
    await waitFor(() => expect(page.result.current.list.hasMore).toBe(false));

    expect(
      vi.mocked(fetchSubscriptionPayments).mock.calls.map(([query]) => query),
    ).toEqual([
      { size: 10, page: 1 },
      { size: 10, page: 2 },
    ]);
  });

  it("화면 안에서 다시 그려지면 읽지 않고, 화면에 다시 들어오면 읽어 둔 쪽을 모두 다시 읽는다", async () => {
    const wrapper = createWrapper();
    const first = renderHook(useSubscribePage, { wrapper });
    await loadTwoPages(first.result);

    const tab = renderHook(() => usePaymentScrollList(baseQuery, true), {
      wrapper,
    });
    await waitTick();
    expect(fetchSubscriptionPayments).not.toHaveBeenCalled();
    tab.unmount();

    first.unmount();
    renderHook(useSubscribePage, { wrapper });
    await waitFor(() =>
      expect(fetchSubscriptionPayments).toHaveBeenCalledTimes(2),
    );
  });

  it("구독 결과를 받으면(useRevalidateSubscriptionData) 보이는 목록이 읽어 둔 쪽을 모두 다시 읽는다", async () => {
    const page = renderHook(useSubscribePage, { wrapper: createWrapper() });
    await loadTwoPages(page.result);

    await act(async () => {
      await page.result.current.revalidate();
    });

    await waitFor(() =>
      expect(fetchSubscriptionPayments).toHaveBeenCalledTimes(2),
    );
  });
});
