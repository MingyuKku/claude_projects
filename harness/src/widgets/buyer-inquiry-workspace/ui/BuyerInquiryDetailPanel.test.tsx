import { render, screen } from "@testing-library/react";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";

import { BuyerInquiryDetailPanel } from "./BuyerInquiryDetailPanel";

import type { BuyerInquiryViewModel } from "@/entities/inquiry";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, serverApiV3: { get: vi.fn() } };
});

const DETAIL = {
  result: true,
  writerName: "김하루",
  email: "haru@email.com",
  phoneNumber: "010-1234-1234",
  orderNumber: null,
  orderDate: null,
  paymentAmount: null,
  campaignType: "PICK형",
  campaignCode: "Q-123412341234",
  shopCode: "LM-000000000000",
  progressStatus: "진행 중",
  progressStartDate: "2026-10-01",
  progressEndDate: "2026-10-31",
  influencerPlatform: null,
  influencerAccountLink: null,
  influencerNickname: "밍구스",
  mainImageUrl: null,
  brandName: "빅버드",
  productName: "스킨케어 캠페인",
};

function inquiry(
  overrides: Partial<BuyerInquiryViewModel> = {},
): BuyerInquiryViewModel {
  return {
    key: "purchaser-501",
    inquiryIdx: 501,
    source: "purchaser",
    status: "waiting",
    campaignIdx: 10,
    orderNumber: null,
    writerName: "김하루",
    body: "배송이 언제 되나요?",
    writeTime: new Date("2026-10-01T10:00"),
    threadUserIdx: null,
    userIdx: null,
    sequence: null,
    preview: "배송이 언제 되나요?",
    lastActivityAt: new Date("2026-10-01T10:00"),
    hasUnread: false,
    brandName: null,
    campaignName: null,
    shopName: null,
    creatorNickname: null,
    ...overrides,
  };
}

function mountPanel(value: BuyerInquiryViewModel) {
  // 상세만 받고 나머지(상품·캠페인 목록·프로필)는 실패해도 패널은 그려짐.
  vi.mocked(serverApiV3.get).mockImplementation((url: string) =>
    url.startsWith("/help/inquiry/")
      ? Promise.resolve(DETAIL)
      : Promise.reject(new Error("not mocked")),
  );
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <BuyerInquiryDetailPanel inquiry={value} />
    </SWRConfig>,
  );
}

describe("구매자 문의 상세 패널의 캠페인 정보 순서", () => {
  it("공구 진행 크리에이터는 진행 기간 아래, 캠페인 코드 위에 있다", async () => {
    mountPanel(inquiry());
    const labels = [
      "진행 기간",
      "공구 진행 크리에이터",
      "캠페인 코드",
      "공구샵 코드",
    ];
    const nodes = await Promise.all(
      labels.map((text) => screen.findByText(text)),
    );
    nodes.slice(1).forEach((node, index) => {
      // 앞 항목이 뒤 항목보다 문서에서 먼저 나옴
      expect(
        nodes[index]!.compareDocumentPosition(node) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });
  });
});

describe("구매자·크리에이터 문의 상세 패널의 캠페인 바로가기", () => {
  it("구매자 문의 상세에는 비활성 캠페인 바로가기 버튼이 있다", async () => {
    mountPanel(inquiry());
    expect(await screen.findByText("캠페인 코드")).toBeInTheDocument();
    // 캠페인 쪽 화면이 만들어지기 전까지 빅버드 문의 상세와 같이 비활성
    expect(
      screen.getByRole("button", { name: "캠페인 바로가기" }),
    ).toBeDisabled();
  });

  it("크리에이터 문의 상세에는 캠페인 바로가기가 없다", async () => {
    mountPanel(inquiry({ key: "creator-601", source: "creator" }));
    expect(await screen.findByText("캠페인 코드")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "캠페인 바로가기" }),
    ).not.toBeInTheDocument();
  });
});
