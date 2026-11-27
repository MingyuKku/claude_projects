import { act, renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";

import { resetCampaignListChanges } from "../model/list-changes";
import { deleteCampaign } from "./campaign-api";
import { completeCampaignDemo } from "./campaign-detail-api";
import { useCampaignPage, useCampaignScrollList } from "./use-campaigns";

import type * as SharedApi from "@/shared/api";
import type { ReactNode } from "react";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApiV3: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const mockGet = vi.mocked(serverApiV3.get);

const PAGE_SIZE = 6;
const TOTAL = PAGE_SIZE * 2;
/** 2쪽 첫 캠페인. */
const SECOND_PAGE_IDX = PAGE_SIZE + 1;

function item(campaignIdx: number) {
  return {
    campaignIdx,
    campaignCode: `PB-${campaignIdx}`,
    serviceType: "PICK",
    productType: "BRAND",
    status: "DRAFT",
    name: `캠페인 ${campaignIdx}`,
    createdDate: "2026-11-16 10:00:00",
  };
}

function pageResponse(page: number) {
  const first = (page - 1) * PAGE_SIZE;
  return {
    list: Array.from({ length: PAGE_SIZE }, (_, i) => item(first + i + 1)),
    count: TOTAL,
    currentPage: page,
    entrySize: PAGE_SIZE,
  };
}

function requestedPages() {
  return mockGet.mock.calls.map(
    ([, options]) => (options as { params: { page: number } }).params.page,
  );
}

// 요청이 더 나가지 않는지까지 보려고 잠시 기다린 뒤 확인함.
async function expectRequestedPages(pages: number[]) {
  if (pages.length > 0) {
    await waitFor(() => expect(requestedPages()).toEqual(pages));
  }
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(requestedPages()).toEqual(pages);
}

function createWrapper() {
  const cache = new Map();
  return ({ children }: { children: ReactNode }) => (
    <SWRConfig value={{ provider: () => cache, dedupingInterval: 0 }}>
      {children}
    </SWRConfig>
  );
}

beforeEach(() => {
  resetCampaignListChanges();
  vi.resetAllMocks();
  mockGet.mockImplementation((_path, options) =>
    Promise.resolve(
      pageResponse((options as { params: { page: number } }).params.page),
    ),
  );
  vi.mocked(serverApiV3.post).mockResolvedValue(undefined);
  vi.mocked(serverApiV3.delete).mockResolvedValue(undefined);
});

describe("현황 목록 복귀 때 다시 읽기", () => {
  function setup(keyword: string) {
    const wrapper = createWrapper();
    const query = { statuses: [], type: null, keyword };
    const mount = () =>
      renderHook(() => useCampaignScrollList(query), { wrapper });
    return { mount };
  }

  // 2쪽까지 이어 읽은 뒤 화면을 떠남.
  async function loadTwoPagesAndLeave(
    mount: ReturnType<typeof setup>["mount"],
  ) {
    const view = mount();
    await waitFor(() => expect(view.result.current.records).toHaveLength(6));
    view.result.current.loadMore();
    await waitFor(() => expect(view.result.current.records).toHaveLength(12));
    view.unmount();
    mockGet.mockClear();
  }

  it("이 앱에서 바꾼 것이 없으면 요청하지 않는다", async () => {
    const { mount } = setup("");
    await loadTwoPagesAndLeave(mount);

    mount();

    await expectRequestedPages([]);
  });

  it("내용만 바뀐 캠페인은 그 캠페인이 있는 쪽만 다시 읽는다", async () => {
    const { mount } = setup("");
    await loadTwoPagesAndLeave(mount);
    await completeCampaignDemo(SECOND_PAGE_IDX);

    mount();

    await expectRequestedPages([2]);
  });

  it("검색 중이면 내용만 바뀌어도 검색 결과에서 빠질 수 있어 읽어 둔 쪽을 모두 다시 읽는다", async () => {
    const { mount } = setup("캠페인");
    await loadTwoPagesAndLeave(mount);
    await completeCampaignDemo(SECOND_PAGE_IDX);

    mount();

    await expectRequestedPages([1, 2]);
  });

  it("목록 구성이 바뀌면 읽어 둔 쪽을 모두 다시 읽고, 그다음 복귀는 요청하지 않는다", async () => {
    const { mount } = setup("");
    await loadTwoPagesAndLeave(mount);
    await deleteCampaign(1);

    const back = mount();
    await expectRequestedPages([1, 2]);
    back.unmount();
    mockGet.mockClear();

    mount();
    await expectRequestedPages([]);
  });

  it("화면에서 직접 다시 읽었으면 그 변경으로 다음 복귀 때 또 읽지 않는다", async () => {
    const { mount } = setup("");
    const view = mount();
    await waitFor(() => expect(view.result.current.records).toHaveLength(6));
    await deleteCampaign(1);
    await act(() => view.result.current.reload());
    view.unmount();
    mockGet.mockClear();

    mount();

    await expectRequestedPages([]);
  });
});

describe("현황 목록 한 쪽 복귀 때 다시 읽기", () => {
  it("보이는 쪽은 하나라 다시 보일 때마다 그 쪽을 다시 읽는다", async () => {
    const wrapper = createWrapper();
    const query = { statuses: [], type: null, keyword: "", page: 2 };
    const first = renderHook(() => useCampaignPage(query), { wrapper });
    await waitFor(() => expect(first.result.current.list).toBeDefined());
    first.unmount();
    mockGet.mockClear();

    renderHook(() => useCampaignPage(query), { wrapper });

    await expectRequestedPages([2]);
  });
});
