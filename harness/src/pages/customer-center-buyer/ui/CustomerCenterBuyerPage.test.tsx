import { render, screen } from "@testing-library/react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";

import { CustomerCenterBuyerPage } from "./CustomerCenterBuyerPage";

const mocks = vi.hoisted(() => ({ width: 1440 }));

const inquiries = [{ key: "purchaser-2" }, { key: "purchaser-1" }];

vi.mock("@/entities/inquiry", () => ({
  useBuyerInquiries: () => ({
    inquiries,
    isLoading: false,
    isError: false,
    isLoadingMore: false,
    hasMore: false,
    loadMore: vi.fn(),
    mutate: vi.fn(),
  }),
}));
vi.mock("@/shared/lib/useMediaQuery", () => ({
  useMediaQuery: (query: string) =>
    mocks.width >= Number(/\d+/.exec(query)?.[0]),
}));
vi.mock("@/widgets/buyer-inquiry-workspace", () => ({
  INQUIRY_MENU: { buyer: { sources: ["purchaser", "qna"] } },
  toBuyerStatusFilter: () => "all",
  toBuyerInquiryFilters: () => ({ sourceType: "ALL" }),
  BuyerInquiryWorkspace: ({
    selectedKey,
    children,
  }: {
    selectedKey?: string;
    children: React.ReactNode;
  }) => (
    <div>
      <p>목록 강조 {selectedKey ?? "없음"}</p>
      {children}
    </div>
  ),
  BuyerInquiryPanels: ({ inquiry }: { inquiry: { key: string } }) => (
    <p>대화 {inquiry.key}</p>
  ),
}));

function renderPage(path: string) {
  const router = createMemoryRouter(
    [
      {
        element: <Outlet context={{ threadUserIdx: 5971 }} />,
        children: [
          {
            path: "/customer-center/buyer",
            element: <CustomerCenterBuyerPage />,
          },
          {
            path: "/customer-center/buyer/:inquiryKey",
            element: <CustomerCenterBuyerPage />,
          },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
}

describe("CustomerCenterBuyerPage", () => {
  beforeEach(() => {
    mocks.width = 1440;
  });

  it("문의를 고르지 않고 들어오면 탭의 첫 문의를 선택한다", () => {
    renderPage("/customer-center/buyer");

    expect(screen.getByText("대화 purchaser-2")).toBeInTheDocument();
    expect(screen.getByText("목록 강조 purchaser-2")).toBeInTheDocument();
  });

  it("주소로 연 문의를 그대로 보여 준다", () => {
    renderPage("/customer-center/buyer/purchaser-1");

    expect(screen.getByText("대화 purchaser-1")).toBeInTheDocument();
  });

  it("MO 목록에서는 자동 선택 문의를 강조하지 않는다", () => {
    mocks.width = 360;
    renderPage("/customer-center/buyer");

    expect(screen.getByText("목록 강조 없음")).toBeInTheDocument();
  });

  // 사용자 결정 2026-11-11: TAB·MO는 목록만 보이므로 자동 선택하지 않음(시안 TAB 목록 프레임도 선택 카드 없음). PC만 자동 선택.
  it("TAB 목록에서는 자동 선택 문의를 강조하지 않고 가려진 패널도 그리지 않는다", () => {
    mocks.width = 768;
    renderPage("/customer-center/buyer");

    expect(screen.getByText("목록 강조 없음")).toBeInTheDocument();
    expect(screen.queryByText("대화 purchaser-2")).not.toBeInTheDocument();
  });

  it("TAB에서 주소로 연 문의는 목록에서 강조한다", () => {
    mocks.width = 768;
    renderPage("/customer-center/buyer/purchaser-1");

    expect(screen.getByText("목록 강조 purchaser-1")).toBeInTheDocument();
  });
});
