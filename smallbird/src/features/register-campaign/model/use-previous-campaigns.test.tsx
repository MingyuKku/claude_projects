import { renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";

import { usePreviousCampaigns } from "./use-previous-campaigns";

import type { ReactNode } from "react";

beforeEach(() => window.sessionStorage.clear());

function wrapper({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      {children}
    </SWRConfig>
  );
}

function render(keyword = "", serviceType: "PICK" | "RECRUIT" = "PICK") {
  return renderHook(
    () => usePreviousCampaigns({ serviceType, excludeCampaignIdx: 0, keyword }),
    { wrapper },
  );
}

describe("usePreviousCampaigns", () => {
  it("같은 서비스 유형의 이전 캠페인을 최신순으로 읽는다", async () => {
    const { result } = render();

    await waitFor(() => expect(result.current.records).toHaveLength(3));

    expect(result.current.records.map((item) => item.name)).toEqual([
      "신상 구매 리뷰",
      "매장 오픈 이벤트",
      "봄 신제품 체험",
    ]);
    expect(result.current.totalCount).toBe(3);
    expect(result.current.hasMore).toBe(false);
  });

  it("검색어로 캠페인명을 거른다", async () => {
    const { result } = render("오픈");

    await waitFor(() => expect(result.current.records).toHaveLength(1));

    expect(result.current.records[0]?.name).toBe("매장 오픈 이벤트");
  });

  it("검색어가 달라지면 새 결과를 읽는다", async () => {
    const { result, rerender } = renderHook(
      ({ keyword }) =>
        usePreviousCampaigns({
          serviceType: "RECRUIT",
          excludeCampaignIdx: 0,
          keyword,
        }),
      { wrapper, initialProps: { keyword: "" } },
    );
    await waitFor(() => expect(result.current.records).toHaveLength(2));

    rerender({ keyword: "기자단" });

    await waitFor(() => expect(result.current.records).toHaveLength(1));
    expect(result.current.records[0]?.name).toBe("가을 기자단 모집");
  });

  it("검색 결과가 없으면 빈 목록이다", async () => {
    const { result } = render("없는캠페인");

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.records).toEqual([]);
    expect(result.current.isError).toBe(false);
  });
});
