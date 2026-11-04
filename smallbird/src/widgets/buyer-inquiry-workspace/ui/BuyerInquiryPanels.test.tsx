import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";
import { ROUTES } from "@/shared/config";

import { OPENED_BY_USER_STATE } from "../model/realtime-inquiry-idx";
import { BuyerInquiryPanels } from "./BuyerInquiryPanels";

import type { BuyerInquiryViewModel } from "@/entities/inquiry";

const flags = vi.hoisted(() => ({ isWriteEnabled: true }));
vi.mock("../model/constants", () => ({
  get IS_BUYER_WRITE_ENABLED() {
    return flags.isWriteEnabled;
  },
}));
vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    serverApiV3: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

const inquiry: BuyerInquiryViewModel = {
  key: "purchaser-501",
  inquiryIdx: 501,
  source: "purchaser",
  status: "done",
  campaignIdx: 10,
  orderNumber: "20261001-0001",
  writerName: "김하루",
  body: "마지막 메시지",
  writeTime: new Date("2026-10-01T10:00"),
  threadUserIdx: 77,
  userIdx: null,
  sequence: null,
  preview: "마지막 메시지",
  lastActivityAt: new Date("2026-10-01T10:00"),
  hasUnread: false,
  brandName: null,
  campaignName: null,
  shopName: null,
};

const message = (
  messageIdx: number,
  body: string,
  isUserMessage: boolean,
  writeTime: string,
) => ({
  messageIdx,
  threadIdx: 1,
  body,
  userIdx: isUserMessage ? 1 : 77,
  sequence: null,
  attachmentIdx: null,
  writeTime,
  readTime: null,
  modifyTime: null,
  deleteTime: null,
  identifier: "mgkang",
  isUserMessage,
  fileName: null,
  fileSize: null,
  fileType: null,
  auto: false,
});

const detail = {
  result: true,
  writerName: "김하루",
  email: "haru@email.com",
  phoneNumber: "010-1234-1234",
  orderNumber: "20261001-0001",
  orderDate: "2026-10-01",
  paymentAmount: 39800,
  campaignType: "퍼포먼스형",
  campaignCode: "C-100",
  shopCode: "S-9",
  progressStatus: "구매중",
  progressStartDate: "2026.10.01",
  progressEndDate: "2026.10.31",
  influencerPlatform: "instagram",
  influencerAccountLink: "https://instagram.com/bigbird",
  mainImageUrl: null,
  brandName: "빅버드",
  productName: "여섯별 스킨케어 세트",
};

beforeEach(() => {
  flags.isWriteEnabled = true;
  vi.mocked(serverApiV3.get).mockReset();
  vi.mocked(serverApiV3.get).mockImplementation(async (path: string) => {
    if (path === "/help/inquiry/purchaser-campaign-timeline")
      return {
        result: true,
        data: [
          message(1, "배송이 언제 되나요?", false, "2026-10-01T10:00:00"),
          message(2, "오늘 발송합니다.", true, "2026-10-01T11:00:00"),
        ],
      };
    return detail;
  });
});

function renderPanels(
  threadUserIdx?: number,
  target: BuyerInquiryViewModel = inquiry,
  onChangeStatus?: () => void,
  state?: unknown,
) {
  const router = createMemoryRouter(
    [
      {
        path: ROUTES.customerCenterBuyerThread,
        element: (
          <BuyerInquiryPanels
            inquiry={target}
            threadUserIdx={threadUserIdx}
            onChangeStatus={onChangeStatus}
          />
        ),
      },
      { path: ROUTES.customerCenterBuyer, element: <p>문의 목록 화면</p> },
    ],
    {
      initialEntries: [
        {
          pathname: "/customer-center/buyer/purchaser-501",
          search: "?status=done",
          state,
        },
      ],
    },
  );
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <RouterProvider router={router} />
    </SWRConfig>,
  );
  return router;
}

function renderPanelsForAccept(target: BuyerInquiryViewModel, state?: unknown) {
  const router = renderPanels(77, target, undefined, state);
  return { router, unmount: () => cleanup() };
}

describe("인플루언서 문의 상담 종료", () => {
  const influencer: BuyerInquiryViewModel = {
    ...inquiry,
    key: "influencer-2092",
    inquiryIdx: 2092,
    source: "influencer",
    status: "consulting",
  };

  it("실시간 상담 중이면 상담 종료로 그 스레드를 끝내고 목록을 다시 받게 한다", async () => {
    vi.mocked(serverApiV3.put).mockResolvedValue({ result: true });
    const onChangeStatus = vi.fn();
    renderPanels(77, influencer, onChangeStatus);
    await userEvent.click(
      await screen.findByRole("button", { name: "상담 종료" }),
    );
    await waitFor(() =>
      expect(serverApiV3.put).toHaveBeenCalledWith(
        "/help/thread/2092",
        undefined,
        { headers: { "X-Device-Id": expect.any(String) } },
      ),
    );
    await waitFor(() => expect(onChangeStatus).toHaveBeenCalled());
  });

  it("자동 선택으로 열린 실시간 문의는 수락하지 않고, 사용자가 직접 연 문의만 수락한다", async () => {
    vi.mocked(serverApiV3.put).mockResolvedValue({ result: true });
    const { unmount } = renderPanelsForAccept({
      ...influencer,
      inquiryIdx: 3001,
    });
    await screen.findByText("김하루");
    expect(serverApiV3.put).not.toHaveBeenCalled();
    unmount();
    renderPanelsForAccept(
      { ...influencer, inquiryIdx: 3002 },
      OPENED_BY_USER_STATE,
    );
    await waitFor(() =>
      expect(serverApiV3.put).toHaveBeenCalledWith(
        "/help/inquiry/3002/realtime/accept",
        undefined,
        { headers: { "X-Device-Id": expect.any(String) } },
      ),
    );
  });

  it("실시간 상담 중이 아니면 버튼이 없다", async () => {
    renderPanels(77, { ...influencer, status: "done" });
    await screen.findByText("김하루");
    expect(screen.queryByRole("button", { name: "상담 종료" })).toBeNull();
  });
});

describe("구매자 문의 오른쪽 패널", () => {
  it("구매자↔광고주 대화를 시간순으로 보여 주고 type=client로 조회한다", async () => {
    renderPanels();
    expect(await screen.findByText("배송이 언제 되나요?")).toBeInTheDocument();
    expect(screen.getByText("오늘 발송합니다.")).toBeInTheDocument();
    // 내 말풍선 위에는 보낸 광고주 계정 id가 보입니다.
    expect(screen.getByText("mgkang")).toBeInTheDocument();
    expect(serverApiV3.get).toHaveBeenCalledWith(
      "/help/inquiry/purchaser-campaign-timeline",
      {
        params: { campaignIdx: 10, purchaserThreadUserIdx: 77 },
      },
    );
    const texts = screen
      .getAllByText(/배송이 언제 되나요\?|오늘 발송합니다\./)
      .map((element) => element.textContent);
    expect(texts).toEqual(["배송이 언제 되나요?", "오늘 발송합니다."]);
  });

  it("구매자 앱이 보낸 캠페인 JSON auto 메시지는 대화에 그리지 않는다", async () => {
    const campaignJson = JSON.stringify({
      brandName: "엘지",
      campaignCode: "L-1",
      mainImageUrl: null,
      productName: "냉장고",
    });
    vi.mocked(serverApiV3.get).mockImplementation(async (path: string) => {
      if (path !== "/help/inquiry/purchaser-campaign-timeline") return detail;
      return {
        result: true,
        data: [
          {
            ...message(1, campaignJson, false, "2026-10-01T10:00:00"),
            auto: true,
          },
          message(2, "배송이 언제 되나요?", false, "2026-10-01T10:01:00"),
        ],
      };
    });
    renderPanels();
    expect(await screen.findByText("배송이 언제 되나요?")).toBeInTheDocument();
    expect(screen.queryByText(/campaignCode/)).not.toBeInTheDocument();
  });

  it("삭제된 메시지는 삭제 표시 없이 대화에서 뺀다", async () => {
    vi.mocked(serverApiV3.get).mockImplementation(async (path: string) => {
      if (path !== "/help/inquiry/purchaser-campaign-timeline") return detail;
      return {
        result: true,
        data: [
          message(1, "배송이 언제 되나요?", false, "2026-10-01T10:00:00"),
          {
            ...message(2, "지운 답변", true, "2026-10-01T10:01:00"),
            deleteTime: "2026-10-01T10:02:00",
          },
        ],
      };
    });
    renderPanels();
    expect(await screen.findByText("배송이 언제 되나요?")).toBeInTheDocument();
    expect(screen.queryByText("지운 답변")).not.toBeInTheDocument();
    expect(
      screen.queryByText("메시지가 삭제되었습니다."),
    ).not.toBeInTheDocument();
  });

  it("상세 정보를 문의 상세 API로 보여 준다", async () => {
    renderPanels();
    expect(await screen.findByText("haru@email.com")).toBeInTheDocument();
    expect(serverApiV3.get).toHaveBeenCalledWith("/help/inquiry/501", {
      params: { sourceType: "PURCHASER_QUESTION" },
    });
    expect(screen.getByText("010-1234-1234")).toBeInTheDocument();
    expect(screen.getByText("39,800원")).toBeInTheDocument();
    expect(screen.getByText("2026.10.01~2026.10.31")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /20261001-0001/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "bigbird" })).toHaveAttribute(
      "href",
      "https://instagram.com/bigbird",
    );
  });

  it("모바일 상세를 URL로 열고 목록으로 돌아갈 때 상태를 유지한다", async () => {
    const user = userEvent.setup();
    const router = renderPanels();
    await user.click(screen.getByRole("button", { name: "상세 정보" }));
    expect(router.state.location.search).toBe("?status=done&panel=detail");
    await user.click(screen.getByRole("button", { name: "상세 정보 닫기" }));
    expect(router.state.location.search).toBe("?status=done");
    await user.click(
      screen.getByRole("button", { name: "문의 목록으로 돌아가기" }),
    );
    expect(router.state.location.pathname).toBe(ROUTES.customerCenterBuyer);
    expect(router.state.location.search).toBe("?status=done");
  });

  it("대화 조회가 실패하면 안내를 보여 준다", async () => {
    vi.mocked(serverApiV3.get).mockImplementation(async (path: string) => {
      if (path === "/help/inquiry/purchaser-campaign-timeline")
        throw new Error("500");
      return detail;
    });
    renderPanels();
    await waitFor(() =>
      expect(
        screen.getByText("대화를 불러오지 못했습니다."),
      ).toBeInTheDocument(),
    );
  });

  it("다른 문의를 고르면 입력 중이던 글을 비워 다른 구매자에게 보내지 않는다", async () => {
    const user = userEvent.setup();
    const other: BuyerInquiryViewModel = {
      ...inquiry,
      key: "purchaser-502",
      inquiryIdx: 502,
      threadUserIdx: 78,
      writerName: "이다은",
    };

    function Harness() {
      const [current, setCurrent] = useState(inquiry);
      return (
        <>
          <button type="button" onClick={() => setCurrent(other)}>
            다음 문의
          </button>
          <BuyerInquiryPanels inquiry={current} />
        </>
      );
    }

    const router = createMemoryRouter(
      [{ path: ROUTES.customerCenterBuyerThread, element: <Harness /> }],
      { initialEntries: ["/customer-center/buyer/purchaser-501"] },
    );
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <RouterProvider router={router} />
      </SWRConfig>,
    );
    const box = await screen.findByRole("textbox");
    await waitFor(() => expect(box).toBeEnabled());
    await user.type(box, "김하루용 답장");
    expect(box).toHaveValue("김하루용 답장");

    await user.click(screen.getByRole("button", { name: "다음 문의" }));
    await waitFor(() => expect(screen.getByRole("textbox")).toHaveValue(""));
  });

  it("상세 정보에 상품 썸네일·이름과 캠페인 배너·이름을 보여 준다", async () => {
    vi.mocked(serverApiV3.get).mockImplementation(async (path: string) => {
      if (path === "/help/thread") return { result: true, data: [] };
      if (path.startsWith("/help/c-purchaser-questionInfo/"))
        return {
          result: true,
          list: {
            orderNumber: "20261001-0001",
            orderState: "배송중",
            newOrderState: "배송중",
            deliveryStatus: null,
            mainImageUrl: "https://img/product.jpg",
            shopCode: "S-9",
            campaignCode: "C-100",
            campaignServiceName: null,
            brandName: "빅버드",
            productName: "여섯별 스킨케어 세트",
          },
        };
      if (path === "/help/c-client-campaign")
        return {
          result: true,
          list: [
            {
              campaignIdx: 10,
              campaignCode: "C-100",
              brandName: "빅버드",
              productName: "스킨케어 캠페인",
              mainImageUrl: "https://img/banner.jpg",
              progressStartDate: "2026.10.01",
              progressEndDate: "2026.10.31",
            },
          ],
        };
      return detail;
    });
    renderPanels(77);
    const product = await screen.findByAltText("빅버드 여섯별 스킨케어 세트");
    expect(product).toHaveAttribute("src", "https://img/product.jpg");
    expect(screen.getByAltText("빅버드 스킨케어 캠페인")).toHaveAttribute(
      "src",
      "https://img/banner.jpg",
    );
    expect(
      screen.getAllByText("빅버드 스킨케어 캠페인").length,
    ).toBeGreaterThan(0);
    expect(serverApiV3.get).toHaveBeenCalledWith(
      "/help/c-purchaser-questionInfo/20261001-0001",
    );
  });

  it("상품·캠페인 이미지를 받지 못해도 상세 정보는 그대로 보인다", async () => {
    vi.mocked(serverApiV3.get).mockImplementation(async (path: string) => {
      if (path === "/help/thread") return { result: true, data: [] };
      if (path === "/help/inquiry/501") return detail;
      throw new Error("500");
    });
    renderPanels(77);
    expect(await screen.findByText("haru@email.com")).toBeInTheDocument();
    expect(screen.getByText("39,800원")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("상품·캠페인 목록에서 못 찾으면 상세 응답의 대표 이미지와 이름으로 채운다", async () => {
    vi.mocked(serverApiV3.get).mockImplementation(async (path: string) => {
      if (path === "/help/thread") return { result: true, data: [] };
      if (path === "/help/inquiry/501") {
        return {
          ...detail,
          mainImageUrl: "https://cdn/shop.png",
          brandName: "빅버드",
          productName: "스킨케어 세트",
        };
      }
      throw new Error("500");
    });
    renderPanels(77);
    // 주문 섹션과 캠페인 섹션 모두 같은 이미지·이름으로 채워진다.
    expect(await screen.findAllByText("빅버드 스킨케어 세트")).toHaveLength(2);
    const images = screen.getAllByRole("img", {
      name: "빅버드 스킨케어 세트",
    });
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", "https://cdn/shop.png");
  });
});
