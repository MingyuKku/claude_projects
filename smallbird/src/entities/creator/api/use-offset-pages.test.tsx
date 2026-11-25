import { act, renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";

import { useOffsetPages } from "./use-offset-pages";

import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      {children}
    </SWRConfig>
  );
}

it("다시 읽어 쪽 수가 줄면 이어 읽는 중이 끝난다", async () => {
  let total = 3;
  const fetchPage = (offset: number) =>
    Promise.resolve({
      items: Array.from(
        { length: Math.min(2, total - offset) },
        (_, index) => offset + index,
      ),
      hasMore: offset + 2 < total,
    });
  const { result } = renderHook(() => useOffsetPages(["list"], 2, fetchPage), {
    wrapper,
  });
  await waitFor(() => expect(result.current.items).toEqual([0, 1]));
  act(() => result.current.loadMore());
  await waitFor(() => expect(result.current.items).toEqual([0, 1, 2]));

  total = 2;
  await act(async () => {
    await result.current.reload();
  });

  await waitFor(() => expect(result.current.items).toEqual([0, 1]));
  expect(result.current.hasMore).toBe(false);
  expect(result.current.isLoadingMore).toBe(false);
});
