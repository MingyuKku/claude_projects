import { renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";

import { useBuyerInquiries } from "./inquiry-api";

import type { ReactNode } from "react";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  serverApiV3: { get: vi.fn() },
}));

// 구매자 계정 구독은 실제 Firestore에 연결하므로 막음(테스트가 끝난 뒤 gRPC 콜백이 터짐).
vi.mock("./helpdesk-changes", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useBuyerAccountChanges: vi.fn(),
}));

const row = (inquiryIdx: number, sourceType: string) => ({
  inquiryIdx,
  sourceType,
  status: "WAITING",
  campaignIdx: 10,
  orderNumber: null,
  writerName: "김하루",
  body: "문의",
  writeTime: "2026-11-02 10:00",
  threadUserIdx: 77,
  userIdx: null,
});

function wrapper({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>
  );
}

describe("useBuyerInquiries", () => {
  it("구매자 메뉴는 받은 쪽이 인플루언서 행뿐이면 보일 행이 나올 때까지 다음 쪽을 이어 받는다", async () => {
    vi.mocked(serverApiV3.get).mockImplementation((_url, config) => {
      const page = (config as { params: { page: number } }).params.page;
      return Promise.resolve({
        result: true,
        list:
          page === 1
            ? [row(1, "INFLUENCER_QUESTION"), row(2, "CAMPAIGN_QNA")]
            : [row(3, "PURCHASER_QUESTION")],
        pagingInfo: { page, size: 20, totalCount: 3, totalPage: 2 },
      });
    });
    const { result } = renderHook(
      () =>
        useBuyerInquiries("all", { sourceType: "ALL" }, ["purchaser", "qna"]),
      { wrapper },
    );
    await waitFor(() =>
      expect(result.current.inquiries?.map((item) => item.key)).toEqual([
        "purchaser-3",
      ]),
    );
    expect(result.current.hasMore).toBe(false);
  });

  it("인플루언서 메뉴는 전용 목록을 받고 거르지 않는다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValue({
      result: true,
      list: [row(4, "INFLUENCER_QUESTION"), row(5, "CAMPAIGN_QNA")],
      pagingInfo: { page: 1, size: 20, totalCount: 2, totalPage: 1 },
    });
    const { result } = renderHook(
      () =>
        useBuyerInquiries("all", { sourceType: "ALL" }, [
          "influencer",
          "campaignQna",
        ]),
      { wrapper },
    );
    await waitFor(() =>
      expect(result.current.inquiries?.map((item) => item.key)).toEqual([
        "influencer-4",
        "campaignQna-5",
      ]),
    );
    expect(serverApiV3.get).toHaveBeenCalledWith(
      "/help/influencer-inquiry",
      expect.objectContaining({
        params: expect.objectContaining({ sourceType: "ALL" }),
      }),
    );
  });
});
