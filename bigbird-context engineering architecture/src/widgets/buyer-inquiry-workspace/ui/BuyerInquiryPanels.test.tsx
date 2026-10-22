import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";
import { ROUTES } from "@/shared/config";

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
  preview: "마지막 메시지",
  lastActivityAt: new Date("2026-10-01T10:00"),
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
  userIdx: 1,
  attachmentIdx: null,
  writeTime,
  readTime: null,
  modifyTime: null,
  deleteTime: null,
  identifier: "id",
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
};

beforeEach(() => {
  flags.isWriteEnabled = true;
  vi.mocked(serverApiV3.get).mockReset();
  vi.mocked(serverApiV3.get).mockImplementation(async (path: string) => {
    if (path === "/help/thread")
      return {
        result: true,
        data: [
          {
            threadIdx: 1,
            sequence: 1,
            viewing: null,
            toUserIdx: 1,
            fmUserIdx: 77,
            campaignIdx: 10,
            finishTime: null,
            created: "2026-10-01T10:00:00",
            boardType: true,
            status: "ANSWERED",
            messages: [
              message(2, "오늘 발송합니다.", true, "2026-10-01T11:00:00"),
              message(1, "배송이 언제 되나요?", false, "2026-10-01T10:00:00"),
            ],
          },
        ],
      };
    return detail;
  });
});

function renderPanels(threadUserIdx?: number) {
  const router = createMemoryRouter(
    [
      {
        path: ROUTES.customerCenterBuyerThread,
        element: (
          <BuyerInquiryPanels inquiry={inquiry} threadUserIdx={threadUserIdx} />
        ),
      },
      { path: ROUTES.customerCenterBuyer, element: <p>문의 목록 화면</p> },
    ],
    { initialEntries: ["/customer-center/buyer/purchaser-501?status=done"] },
  );
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <RouterProvider router={router} />
    </SWRConfig>,
  );
  return router;
}

describe("구매자 문의 오른쪽 패널", () => {
  it("구매자↔광고주 대화를 시간순으로 보여 주고 type=client로 조회한다", async () => {
    renderPanels();
    expect(await screen.findByText("배송이 언제 되나요?")).toBeInTheDocument();
    expect(screen.getByText("오늘 발송합니다.")).toBeInTheDocument();
    expect(serverApiV3.get).toHaveBeenCalledWith("/help/thread", {
      params: { threadUserIdx: 77, type: "client", campaignIdx: 10 },
    });
    const texts = screen
      .getAllByText(/배송이 언제 되나요\?|오늘 발송합니다\./)
      .map((element) => element.textContent);
    expect(texts).toEqual(["배송이 언제 되나요?", "오늘 발송합니다."]);
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
    expect(screen.getByRole("link", { name: "instagram" })).toHaveAttribute(
      "href",
      "https://instagram.com/bigbird",
    );
  });

  it("상담 기록을 열고 닫는다", async () => {
    const user = userEvent.setup();
    const router = renderPanels();
    await user.click(screen.getByRole("button", { name: "상담 기록" }));
    expect(router.state.location.search).toBe("?status=done&panel=history");
    const history = screen.getByRole("region", { name: "상담 기록" });
    expect(
      await within(history).findByText("배송이 언제 되나요?"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "상담 기록 닫기" }));
    expect(router.state.location.search).toBe("?status=done");
  });

  it("상담 기록은 과거 상담(스레드)별로 날짜·캠페인 카드·대화를 보여 주고 삭제된 메시지는 안내로 바꾼다", async () => {
    const user = userEvent.setup();
    const aThread = (
      threadIdx: number,
      created: string,
      campaignIdx: number,
      body: string,
      deleteTime: string | null = null,
    ) => ({
      threadIdx,
      sequence: threadIdx,
      viewing: null,
      toUserIdx: 1,
      fmUserIdx: 77,
      campaignIdx,
      finishTime: "2026-10-05T10:00:00",
      created,
      boardType: true,
      status: "ANSWERED",
      messages: [{ ...message(threadIdx, body, false, created), deleteTime }],
    });
    vi.mocked(serverApiV3.get).mockImplementation(async (path: string) => {
      if (path === "/help/thread")
        return {
          result: true,
          data: [
            aThread(2, "2026-10-08T10:00:00", 11, "두 번째 상담 질문"),
            aThread(1, "2026-10-01T10:00:00", 10, "첫 번째 상담 질문"),
            aThread(
              3,
              "2026-10-09T10:00:00",
              11,
              "지운 글",
              "2026-10-09T11:00:00",
            ),
          ],
        };
      if (path === "/help/c-client-campaign")
        return {
          result: true,
          list: [
            {
              campaignIdx: 10,
              campaignCode: "C-10",
              brandName: "빅버드",
              productName: "첫 캠페인",
              mainImageUrl: null,
              progressStartDate: "2026.01.01",
              progressEndDate: "2026.12.31",
            },
            {
              campaignIdx: 11,
              campaignCode: "C-11",
              brandName: "빅버드",
              productName: "둘째 캠페인",
              mainImageUrl: null,
              progressStartDate: "2026.01.01",
              progressEndDate: "2026.12.31",
            },
          ],
        };
      return detail;
    });
    renderPanels(77);
    await user.click(screen.getByRole("button", { name: "상담 기록" }));
    const history = screen.getByRole("region", { name: "상담 기록" });
    const first = await within(history).findByText("첫 번째 상담 질문");
    const second = within(history).getByText("두 번째 상담 질문");
    // 오래된 상담이 위에 옴.
    expect(
      first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(await within(history).findByText("첫 캠페인")).toBeInTheDocument();
    expect(within(history).getAllByText("둘째 캠페인")).toHaveLength(2);
    expect(
      within(history).getByText("메시지가 삭제되었습니다."),
    ).toBeInTheDocument();
    expect(within(history).queryByText("지운 글")).not.toBeInTheDocument();
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
      if (path === "/help/thread") throw new Error("500");
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
    const product = await screen.findByAltText("[빅버드]여섯별 스킨케어 세트");
    expect(product).toHaveAttribute("src", "https://img/product.jpg");
    expect(screen.getByAltText("[빅버드]스킨케어 캠페인")).toHaveAttribute(
      "src",
      "https://img/banner.jpg",
    );
    expect(
      screen.getAllByText("[빅버드]스킨케어 캠페인").length,
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
});
