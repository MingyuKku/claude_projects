import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";

import { ROUTES } from "@/shared/config";

import { BuyerInquiryWorkspace } from "./BuyerInquiryWorkspace";

import type { BuyerInquiryViewModel } from "@/entities/inquiry";

// Radix(ScrollArea·Tabs)가 쓰는 브라우저 API가 jsdom에 없어 이 파일에서만 채움.
let observerCallback: IntersectionObserverCallback | undefined;
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  globalThis.IntersectionObserver = class {
    constructor(callback: IntersectionObserverCallback) {
      observerCallback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
});

function inquiry(
  overrides: Partial<BuyerInquiryViewModel> = {},
): BuyerInquiryViewModel {
  return {
    key: "purchaser-501",
    inquiryIdx: 501,
    source: "purchaser",
    status: "waiting",
    campaignIdx: 10,
    orderNumber: "20261001-0001",
    writerName: "김하루",
    body: "배송이 언제 되나요?",
    writeTime: new Date("2026-10-01T10:00"),
    threadUserIdx: 77,
    userIdx: null,
    sequence: null,
    preview: "배송이 언제 되나요?",
    lastActivityAt: new Date("2026-10-01T10:00"),
    hasUnread: false,
    brandName: null,
    campaignName: null,
    shopName: null,
    influencerNickname: null,
    ...overrides,
  };
}

function renderWorkspace(
  props: Partial<Parameters<typeof BuyerInquiryWorkspace>[0]> = {},
  path: string = ROUTES.customerCenterBuyer,
) {
  const router = createMemoryRouter(
    [
      {
        path:
          props.menu === "influencer"
            ? ROUTES.customerCenterInfluencerThread
            : ROUTES.customerCenterBuyerThread,
        element: (
          <BuyerInquiryWorkspace
            menu="buyer"
            inquiries={[inquiry()]}
            isLoading={false}
            isError={false}
            isLoadingMore={false}
            hasMore={false}
            onClickRefresh={() => {}}
            onLoadMore={() => {}}
            isPanelOpen={false}
            panelLabel="대화"
            {...props}
          >
            <p>패널</p>
          </BuyerInquiryWorkspace>
        ),
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe("구매자 문의 목록", () => {
  it("필터 문의 유형을 적용하면 URL에 남긴다", async () => {
    const user = userEvent.setup();
    const router = renderWorkspace();
    await user.click(screen.getByRole("button", { name: "필터" }));
    await user.click(screen.getByRole("button", { name: "상품 Q&A" }));
    await user.click(screen.getByRole("button", { name: "적용하기" }));
    expect(router.state.location.search).toBe("?source=qna");
  });

  it("상태·출처 배지와 @작성자, 캠페인을 못 찾은 문의는 내용 처음 10자를 보여 준다", () => {
    renderWorkspace();
    expect(screen.getByText("@김하루")).toBeInTheDocument();
    expect(screen.getByText("배송이 언제 되나요...")).toBeInTheDocument();
    expect(screen.getAllByText("답변 대기").length).toBeGreaterThan(0);
    expect(screen.getByText("구매자 문의")).toBeInTheDocument();
  });

  it("서버가 준 캠페인 값으로 카드 문구를 만들고, 안 읽은 문의에 점을 보여 준다", () => {
    renderWorkspace({
      inquiries: [
        inquiry({
          brandName: "빅버드",
          campaignName: "스킨케어",
          hasUnread: true,
        }),
      ],
    });
    // 첫 줄은 회색 브랜드명 + "캠페인명 문의"(Figma 26/10/29)
    expect(screen.getByText("빅버드")).toBeInTheDocument();
    expect(screen.getByText("스킨케어 문의")).toBeInTheDocument();
    expect(screen.getByText("읽지 않은 메시지")).toBeInTheDocument();
  });

  it.each([
    ["consulting", "실시간 상담 중"],
    ["done", "답변 완료"],
  ] as const)("%s 문의 카드에도 상태 배지(%s)를 붙인다", (status, label) => {
    renderWorkspace({ inquiries: [inquiry({ status })] });
    // 탭에도 비슷한 이름이 있어 카드(li) 안에서만 찾음.
    const card = screen.getByText("구매자 문의").closest("li");
    expect(within(card!).getByText(label)).toBeInTheDocument();
  });

  it("상태 탭 순서는 전체·답변 대기·상담 중·답변 완료다", () => {
    renderWorkspace();
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "전체",
      "답변 대기",
      "상담 중",
      "답변 완료",
    ]);
  });

  it("상태 탭에 상담 중이 있고 누르면 status=consulting으로 바꾼다", async () => {
    const user = userEvent.setup();
    const router = renderWorkspace();
    await user.click(screen.getByRole("tab", { name: "상담 중" }));
    expect(router.state.location.search).toBe("?status=consulting");
  });

  it("문의를 누르면 출처가 담긴 키로 이동하고 목록 상태(탭)를 유지한다", async () => {
    const user = userEvent.setup();
    const router = renderWorkspace(
      {},
      `${ROUTES.customerCenterBuyer}?status=waiting`,
    );
    await user.click(screen.getByRole("button", { name: /@김하루/ }));
    expect(router.state.location.pathname).toBe(
      "/customer-center/buyer/purchaser-501",
    );
    expect(router.state.location.search).toBe("?status=waiting");
  });

  it("인플루언서 문의 메뉴는 인플루언서 경로로 이동하고 필터 유형이 인플루언서 문의·캠페인 Q&A다", async () => {
    const user = userEvent.setup();
    const router = renderWorkspace(
      {
        menu: "influencer",
        inquiries: [
          inquiry({
            key: "influencer-601",
            inquiryIdx: 601,
            source: "influencer",
            orderNumber: null,
          }),
        ],
      },
      ROUTES.customerCenterInfluencer,
    );
    expect(screen.getByText("인플루언서 문의")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /@김하루/ }));
    expect(router.state.location.pathname).toBe(
      "/customer-center/influencer/influencer-601",
    );
    await user.click(screen.getByRole("button", { name: "필터" }));
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("button", { name: "캠페인 Q&A" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "상품 Q&A" }),
    ).not.toBeInTheDocument();
  });

  it("탭을 누르면 URL의 status만 바꾼다(전체는 지운다)", async () => {
    const user = userEvent.setup();
    const router = renderWorkspace();
    await user.click(screen.getByRole("tab", { name: "답변 완료" }));
    expect(router.state.location.search).toBe("?status=done");
    await user.click(screen.getByRole("tab", { name: "전체" }));
    expect(router.state.location.search).toBe("");
  });

  it("알 수 없는 status는 전체 탭으로 본다", () => {
    renderWorkspace({}, `${ROUTES.customerCenterBuyer}?status=unknown`);
    expect(screen.getByRole("tab", { name: "전체" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("목록 끝이 보이면 다음 쪽을 요청한다", () => {
    const onLoadMore = vi.fn();
    renderWorkspace({ hasMore: true, onLoadMore });
    observerCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(onLoadMore).toHaveBeenCalledOnce();
  });

  it("조회에 실패하면 '문의 없음'이 아니라 오류와 다시 시도를 보여 준다", async () => {
    const user = userEvent.setup();
    const onClickRefresh = vi.fn();
    renderWorkspace({ inquiries: undefined, isError: true, onClickRefresh });
    expect(
      screen.getByText("문의 목록을 불러오지 못했습니다."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("문의사항이 존재하지 않습니다."),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onClickRefresh).toHaveBeenCalledOnce();
  });

  it("문의가 없으면 빈 상태를 보여 준다", () => {
    renderWorkspace({ inquiries: [] });
    expect(
      screen.getByText("문의사항이 존재하지 않습니다."),
    ).toBeInTheDocument();
  });

  it("검색어를 입력하고 Enter를 누르면 URL에 남기고, 비우면 지운다", async () => {
    const user = userEvent.setup();
    const router = renderWorkspace();
    const box = screen.getByRole("searchbox");
    await user.type(box, "김하루{Enter}");
    expect(new URLSearchParams(router.state.location.search).get("q")).toBe(
      "김하루",
    );
    await user.clear(screen.getByRole("searchbox"));
    await user.type(screen.getByRole("searchbox"), "{Enter}");
    expect(router.state.location.search).toBe("");
  });

  it("검색어와 일치하는 작성자 이름을 강조해 보여 준다", () => {
    renderWorkspace({}, `${ROUTES.customerCenterBuyer}?q=하루`);
    expect(screen.getByRole("searchbox")).toHaveValue("하루");
    expect(screen.getByText("하루").tagName).toBe("MARK");
  });

  it("검색 결과가 없으면 검색어를 넣은 안내를 보여 준다", () => {
    renderWorkspace(
      { inquiries: [] },
      `${ROUTES.customerCenterBuyer}?q=${encodeURIComponent("없는이름")}`,
    );
    expect(
      screen.getByText("‘없는이름’에 대한 결과가 없습니다."),
    ).toBeInTheDocument();
  });
});
