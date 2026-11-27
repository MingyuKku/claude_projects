import { act, render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";

import { useInfinitePages } from "./useInfinitePages";

import type { PagedResult } from "./useInfinitePages";
import type { ReactNode } from "react";

function List({
  fetchPage,
  isEnabled = true,
}: {
  fetchPage: (page: number) => Promise<PagedResult<string>>;
  isEnabled?: boolean;
}) {
  const { records, isLoading } = useInfinitePages(["list"], fetchPage, {
    isEnabled,
    revalidateFirstPage: true,
  });
  if (isLoading) return <p>loading</p>;
  return <p>{records.join(",") || "empty"}</p>;
}

// 다른 화면에서 목록 맨 위에 항목이 생긴 상황을 흉내 냄.
function createServer() {
  const server = { records: ["A"] };
  const fetchPage = vi.fn(async () => ({
    records: [...server.records],
    totalCount: server.records.length,
    totalPages: 1,
  }));
  return { server, fetchPage };
}

describe("useInfinitePages 첫 쪽 재확인을 켠 경우", () => {
  // 테스트마다 새 캐시를 쓰고, 다시 마운트해도 같은 캐시를 보게 함.
  function createWrapper() {
    const cache = new Map();
    return (ui: ReactNode) => (
      <SWRConfig value={{ provider: () => cache, dedupingInterval: 0 }}>
        {ui}
      </SWRConfig>
    );
  }

  it("다시 마운트되면(화면 복귀) 캐시를 먼저 보이고 첫 쪽을 다시 읽는다", async () => {
    const wrap = createWrapper();
    const { server, fetchPage } = createServer();
    const first = render(wrap(<List fetchPage={fetchPage} />));
    await screen.findByText("A");
    first.unmount();

    server.records = ["NEW", "A"];
    render(wrap(<List fetchPage={fetchPage} />));

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(await screen.findByText("NEW,A")).toBeInTheDocument();
  });

  it("꺼져 있다가 다시 켜지면(PC → MO 전환) 첫 쪽을 다시 읽는다", async () => {
    const wrap = createWrapper();
    const { server, fetchPage } = createServer();
    const view = render(wrap(<List fetchPage={fetchPage} />));
    await screen.findByText("A");

    view.rerender(wrap(<List fetchPage={fetchPage} isEnabled={false} />));
    server.records = ["NEW", "A"];
    view.rerender(wrap(<List fetchPage={fetchPage} />));

    expect(await screen.findByText("NEW,A")).toBeInTheDocument();
    await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(2));
  });
});

describe("useInfinitePages 기본값(첫 쪽 재확인 끔)과 고른 쪽만 다시 읽기", () => {
  type Pages = Record<number, string[]>;

  function TwoPageList({
    fetchPage,
    onReady,
  }: {
    fetchPage: (page: number) => Promise<PagedResult<string>>;
    onReady?: (list: ReturnType<typeof useInfinitePages<string>>) => void;
  }) {
    const list = useInfinitePages(["two-page-list"], fetchPage);
    onReady?.(list);
    return (
      <>
        <p>{list.records.join(",")}</p>
        {list.hasMore && <button onClick={list.loadMore}>more</button>}
      </>
    );
  }

  // 2쪽까지 읽은 뒤 화면을 떠났다가 다시 그림.
  async function renderAfterLeaving(pages: Pages) {
    const cache = new Map();
    const fetchPage = vi.fn(async (page: number) => ({
      records: [...(pages[page] ?? [])],
      totalCount: 2,
      totalPages: 2,
    }));
    const wrap = (ui: ReactNode) => (
      <SWRConfig value={{ provider: () => cache, dedupingInterval: 0 }}>
        {ui}
      </SWRConfig>
    );
    const first = render(wrap(<TwoPageList fetchPage={fetchPage} />));
    (await screen.findByRole("button", { name: "more" })).click();
    await screen.findByText("A,B");
    first.unmount();
    fetchPage.mockClear();
    let latest: ReturnType<typeof useInfinitePages<string>> | undefined;
    render(
      wrap(
        <TwoPageList
          fetchPage={fetchPage}
          onReady={(list) => {
            latest = list;
          }}
        />,
      ),
    );
    return { fetchPage, getList: () => latest };
  }

  it("다시 그려져도 캐시만 보이고 요청하지 않는다", async () => {
    const pages: Pages = { 1: ["A"], 2: ["B"] };
    const { fetchPage } = await renderAfterLeaving(pages);
    pages[1] = ["A-new"];
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.getByText("A,B")).toBeInTheDocument();
    expect(fetchPage).not.toHaveBeenCalled();
  });

  it("고른 쪽만 다시 읽는다", async () => {
    const pages: Pages = { 1: ["A"], 2: ["B"] };
    const { fetchPage, getList } = await renderAfterLeaving(pages);
    pages[2] = ["B-edited"];

    await act(() =>
      getList()?.revalidatePages((page) => page.records.includes("B")),
    );

    expect(await screen.findByText("A,B-edited")).toBeInTheDocument();
    expect(fetchPage.mock.calls.map(([page]) => page)).toEqual([2]);
  });
});
