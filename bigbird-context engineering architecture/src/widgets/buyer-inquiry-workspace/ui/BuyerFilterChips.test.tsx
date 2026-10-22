import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";
import { ROUTES } from "@/shared/config";

import { BuyerInquiryWorkspace } from "./BuyerInquiryWorkspace";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, serverApiV3: { get: vi.fn() } };
});

// Radix(ScrollArea·Tabs)가 쓰는 브라우저 API가 jsdom에 없어 이 파일에서만 채움.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
});

beforeEach(() => {
  vi.mocked(serverApiV3.get).mockReset();
  vi.mocked(serverApiV3.get).mockImplementation(async (path: string) => {
    if (path === "/help/c-client-campaign")
      return {
        result: true,
        list: [
          {
            campaignIdx: 10,
            campaignCode: "P-1",
            brandName: "빅버드",
            productName: "스킨케어 캠페인",
            mainImageUrl: "https://img/1.jpg",
            progressStartDate: "2026.01.01",
            progressEndDate: "2026.12.31",
          },
        ],
      };
    if (path === "/help/influencer-filter")
      return {
        result: true,
        list: [{ threadUserIdx: 5, displayName: "김빅버드" }],
      };
    throw new Error(`예상하지 못한 호출: ${path}`);
  });
});

function renderWorkspace(search: string) {
  const router = createMemoryRouter(
    [
      {
        path: ROUTES.customerCenterBuyerThread,
        element: (
          <BuyerInquiryWorkspace
            inquiries={[]}
            isLoading={false}
            isError={false}
            isLoadingMore={false}
            hasMore={false}
            onClickRefresh={() => {}}
            onLoadMore={() => {}}
            isPanelOpen={false}
            panelLabel="대화"
            threadUserIdx={77}
          >
            <p>패널</p>
          </BuyerInquiryWorkspace>
        ),
      },
    ],
    { initialEntries: [`${ROUTES.customerCenterBuyer}${search}`] },
  );
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <RouterProvider router={router} />
    </SWRConfig>,
  );
  return router;
}

describe("구매자 목록 적용된 필터 칩", () => {
  it("적용한 캠페인·인플루언서를 이름으로 칩에 보여 주고 필터 버튼을 활성 색으로 바꾼다", async () => {
    renderWorkspace("?campaignIdx=10&influencerThreadUserIdx=5");
    expect(
      await screen.findByRole("button", {
        name: "[빅버드]스킨케어 캠페인 조건 해제",
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "김빅버드 조건 해제" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "필터" })).toHaveClass(
      "text-primary",
    );
  });

  it("조건이 없으면 칩이 없다", () => {
    renderWorkspace("");
    expect(screen.queryByText(/조건 해제/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "필터" })).not.toHaveClass(
      "text-primary",
    );
  });

  it("이름을 아직 모르면 번호로 대신하고, 인플루언서 칩의 ×는 그 조건만 푼다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValue({ result: true, list: [] });
    const user = userEvent.setup();
    const router = renderWorkspace("?campaignIdx=10&influencerThreadUserIdx=5");
    await user.click(
      await screen.findByRole("button", { name: "인플루언서 5 조건 해제" }),
    );
    await waitFor(() =>
      expect(router.state.location.search).toBe("?campaignIdx=10"),
    );
  });

  it("캠페인 칩의 ×는 그 캠페인에 묶인 인플루언서 조건까지 함께 푼다", async () => {
    const user = userEvent.setup();
    const router = renderWorkspace("?campaignIdx=10&influencerThreadUserIdx=5");
    await user.click(
      await screen.findByRole("button", {
        name: "[빅버드]스킨케어 캠페인 조건 해제",
      }),
    );
    await waitFor(() => expect(router.state.location.search).toBe(""));
    expect(screen.queryByText(/조건 해제/)).not.toBeInTheDocument();
  });
});
