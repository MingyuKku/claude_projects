import { act, renderHook, waitFor } from "@testing-library/react";
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
  it("변경 확인에서 바뀐 게 있다고 하면 목록을 한 번 다시 받고, 없다고 하면 받지 않는다", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const hasUpdatesAnswers = [false, true, false];
      vi.mocked(serverApiV3.get).mockImplementation((url) =>
        Promise.resolve(
          url === "/help/influencer-inquiry/has-updates"
            ? {
                result: true,
                hasUpdates: hasUpdatesAnswers.shift() ?? false,
                checkedAt: "2026-11-09 14:00:10",
              }
            : {
                result: true,
                list: [row(4, "INFLUENCER_QUESTION")],
                pagingInfo: { page: 1, size: 20, totalCount: 1, totalPage: 1 },
              },
        ),
      );
      const listCalls = () =>
        vi
          .mocked(serverApiV3.get)
          .mock.calls.filter(([url]) => url === "/help/influencer-inquiry")
          .length;
      const checkCalls = () =>
        vi
          .mocked(serverApiV3.get)
          .mock.calls.filter(
            ([url]) => url === "/help/influencer-inquiry/has-updates",
          ).length;
      const { result } = renderHook(
        () => useBuyerInquiries("all", { sourceType: "ALL" }, ["influencer"]),
        { wrapper },
      );
      await waitFor(() => expect(result.current.inquiries).toHaveLength(1));
      expect(listCalls()).toBe(1);

      // 첫 확인: 바뀐 게 없음 → 목록을 다시 받지 않음
      await act(() => vi.advanceTimersByTimeAsync(10_000));
      expect(checkCalls()).toBe(1);
      expect(listCalls()).toBe(1);
      // 두 번째 확인: 바뀐 게 있음 → 합침 0.3초 뒤 목록을 한 번 다시 받음
      await act(() => vi.advanceTimersByTimeAsync(10_000));
      expect(checkCalls()).toBe(2);
      await act(() => vi.advanceTimersByTimeAsync(300));
      await waitFor(() => expect(listCalls()).toBe(2));
      // 세 번째 확인: 바뀐 게 없음 → 그대로
      await act(() => vi.advanceTimersByTimeAsync(10_000));
      expect(checkCalls()).toBe(3);
      expect(listCalls()).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
