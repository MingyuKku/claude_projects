import { renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";

import { fetchChargeList } from "./charge-api";
import { useChargeHistory } from "./use-charge-history";

import type { ChargeQuery } from "../model/charge-types";
import type { ReactNode } from "react";

vi.mock("./charge-api", () => ({ fetchChargeList: vi.fn() }));

const query: ChargeQuery = { page: 1, entrySize: 10 };
const list = { records: [], totalCount: 0, page: 1, totalPages: 0 };

// 중복 요청 합치기(dedupingInterval)를 꺼서, 캐시가 있는데도 다시 읽는지만 드러나게 함.
function wrapper({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      {children}
    </SWRConfig>
  );
}

describe("useChargeHistory", () => {
  beforeEach(() => vi.mocked(fetchChargeList).mockResolvedValue(list));
  afterEach(() => vi.mocked(fetchChargeList).mockReset());

  // 목록을 먼저 읽고 나서 상세를 여는(훅이 뒤늦게 붙는) 순서를 흉내 냄.
  function renderListThenDetail(detailOptions?: {
    revalidateIfStale: boolean;
  }) {
    return renderHook(
      ({ isDetailOpen }) => ({
        listHook: useChargeHistory(query),
        detailHook: useChargeHistory(
          isDetailOpen ? query : null,
          detailOptions,
        ),
      }),
      { wrapper, initialProps: { isDetailOpen: false } },
    );
  }

  it("revalidateIfStale을 끄면 상세를 열 때 목록이 읽어 둔 캐시를 다시 요청하지 않는다", async () => {
    const { result, rerender } = renderListThenDetail({
      revalidateIfStale: false,
    });
    await waitFor(() => expect(result.current.listHook.list).toBeDefined());

    rerender({ isDetailOpen: true });

    await waitFor(() => expect(result.current.detailHook.list).toBeDefined());
    expect(fetchChargeList).toHaveBeenCalledTimes(1);
  });

  it("기본값이면 상세를 열 때 같은 요청을 다시 보낸다(옵션이 필요한 이유)", async () => {
    const { result, rerender } = renderListThenDetail();
    await waitFor(() => expect(result.current.listHook.list).toBeDefined());

    rerender({ isDetailOpen: true });

    await waitFor(() => expect(fetchChargeList).toHaveBeenCalledTimes(2));
  });

  it("캐시가 없으면 한 번 읽는다(주소로 상세를 바로 열 때)", async () => {
    const { result } = renderHook(
      () => useChargeHistory(query, { revalidateIfStale: false }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.list).toBeDefined());
    expect(fetchChargeList).toHaveBeenCalledTimes(1);
  });
});
