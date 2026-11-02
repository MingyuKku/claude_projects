import { act, renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";

import { useBigbirdInquiries, useBigbirdInquiryDetail } from "./inquiry-api";

import type { ReactNode } from "react";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, serverApiV3: { get: vi.fn() } };
});
// 실시간 상담(Firestore) 구독은 이 테스트의 관심사가 아니라 REST 목록을 그대로 돌려줌.
vi.mock("./helpdesk-changes", () => ({
  useInquirySummaryChanges: vi.fn(),
}));
vi.mock("./use-live-inquiries", () => ({
  useLiveInquiries: (_threadUserIdx: unknown, inquiries: unknown) => inquiries,
}));

const item = (threadIdx: number) => ({
  threadIdx,
  sequence: threadIdx,
  campaignIdx: null,
  status: "WAITING",
  created: "2026-10-01 10:00",
  finishTime: null,
  boardType: true,
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <SWRConfig
    value={{
      provider: () => new Map(),
      revalidateOnFocus: false,
      focusThrottleInterval: 0,
      dedupingInterval: 0,
    }}
  >
    {children}
  </SWRConfig>
);

describe("useBigbirdInquiries", () => {
  it("끝까지 내리면 다음 쪽을 이어 받고, 더 없으면 멈춘다", async () => {
    // 첫 쪽은 다시 받을 수 있어 호출 순서가 아니라 offset으로 답함.
    vi.mocked(serverApiV3.get).mockImplementation((_path, config) =>
      Promise.resolve(
        config?.params?.offset === 0
          ? { result: true, list: [item(2)], hasMore: true }
          : { result: true, list: [item(1)], hasMore: false },
      ),
    );
    const { result } = renderHook(() => useBigbirdInquiries(5971), { wrapper });
    await waitFor(() => expect(result.current.hasMore).toBe(true));
    expect(result.current.inquiries?.map((i) => i.threadIdx)).toEqual([2]);

    act(() => result.current.loadMore());

    await waitFor(() =>
      expect(result.current.inquiries?.map((i) => i.threadIdx)).toEqual([2, 1]),
    );
    expect(result.current.hasMore).toBe(false);
    expect(serverApiV3.get).toHaveBeenLastCalledWith(
      "/help/bigbird-inquiry",
      expect.objectContaining({
        params: expect.objectContaining({ offset: 20 }),
      }),
    );
  });

  it("방금 만든 문의를 서버 목록이 오기 전에 맨 앞에 넣는다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValue({
      result: true,
      list: [item(1)],
      hasMore: false,
    });
    const { result } = renderHook(() => useBigbirdInquiries(5971), { wrapper });
    await waitFor(() => expect(result.current.inquiries).toHaveLength(1));

    act(() =>
      result.current.addInquiry({
        ...result.current.inquiries![0]!,
        threadIdx: 9,
      }),
    );

    await waitFor(() =>
      expect(result.current.inquiries?.[0]?.threadIdx).toBe(9),
    );
  });

  it("여러 쪽을 불러 둔 뒤 새 문의를 넣으면 불러 둔 쪽을 모두 다시 받는다", async () => {
    vi.mocked(serverApiV3.get).mockImplementation((_path, config) =>
      Promise.resolve(
        config?.params?.offset === 0
          ? { result: true, list: [item(2)], hasMore: true }
          : { result: true, list: [item(1)], hasMore: false },
      ),
    );
    const { result } = renderHook(() => useBigbirdInquiries(5971), { wrapper });
    await waitFor(() => expect(result.current.hasMore).toBe(true));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.inquiries).toHaveLength(2));
    vi.mocked(serverApiV3.get).mockClear();

    act(() =>
      result.current.addInquiry({
        ...result.current.inquiries![0]!,
        threadIdx: 9,
      }),
    );

    // 첫 쪽만 다시 받으면 offset이 밀려 둘째 쪽 항목이 빠지거나 겹침.
    await waitFor(() => {
      const offsets = vi
        .mocked(serverApiV3.get)
        .mock.calls.map(([, config]) => config?.params?.offset);
      expect(offsets).toEqual(expect.arrayContaining([0, 20]));
    });
  });

  describe("운영 답장 신호로 열어 둔 상세를 다시 받기", () => {
    afterEach(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "visible",
      });
    });

    function setVisibility(value: DocumentVisibilityState) {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value,
      });
    }

    const detailCalls = () =>
      vi
        .mocked(serverApiV3.get)
        .mock.calls.filter(([path]) => path === "/help/bigbird-inquiry/7");

    it("탭이 가려져 있으면 상세(읽음 처리)를 받지 않고, 보일 때는 받는다", async () => {
      vi.mocked(serverApiV3.get).mockImplementation((path) =>
        Promise.resolve(
          path === "/help/bigbird-inquiry"
            ? { result: true, list: [item(7)], hasMore: false }
            : { result: true, data: { messages: [] } },
        ),
      );
      const { result } = renderHook(
        () => ({
          list: useBigbirdInquiries(5971),
          detail: useBigbirdInquiryDetail(5971, 7, true),
        }),
        { wrapper },
      );
      await waitFor(() => expect(result.current.detail.messages).toEqual([]));
      vi.mocked(serverApiV3.get).mockClear();

      setVisibility("hidden");
      act(() => result.current.list.refresh());
      await waitFor(() =>
        expect(serverApiV3.get).toHaveBeenCalledWith(
          "/help/bigbird-inquiry",
          expect.anything(),
        ),
      );
      expect(detailCalls()).toHaveLength(0);

      setVisibility("visible");
      act(() => result.current.list.refresh());
      await waitFor(() => expect(detailCalls()).toHaveLength(1));
    });
  });
});
