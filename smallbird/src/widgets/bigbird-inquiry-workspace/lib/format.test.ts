import { getInquiryTitleKey, getOtherInquiryPreview } from "./format";

import type {
  BigbirdInquiryViewModel,
  InquiryMessageViewModel,
} from "@/entities/inquiry";

function message(
  overrides: Partial<InquiryMessageViewModel>,
): InquiryMessageViewModel {
  return {
    id: 1,
    kind: "text",
    isMine: true,
    body: "",
    createdAt: new Date("2026-10-29T10:00:00"),
    isDeleted: false,
    isRead: false,
    isEdited: false,
    senderId: null,
    campaign: null,
    attachment: null,
    ...overrides,
  };
}

function inquiry(messages: InquiryMessageViewModel[]): BigbirdInquiryViewModel {
  return {
    threadIdx: 1,
    sequence: 1,
    campaignIdx: null,
    isRealtime: false,
    isFinished: false,
    status: "waiting",
    realtimePhase: null,
    createdAt: new Date("2026-10-29T09:00:00"),
    messages,
  };
}

describe("getOtherInquiryPreview", () => {
  it("최근 글 메시지를 20자까지 보이고 넘으면 ...을 붙인다", () => {
    expect(
      getOtherInquiryPreview(
        inquiry([
          message({ body: "처음 질문" }),
          message({
            body: "주문했는데 배송 시작이 늦어지는 것 같습니다 확인 부탁",
          }),
        ]),
      ),
    ).toBe("주문했는데 배송 시작이 늦어지는 것...");
    expect(
      getOtherInquiryPreview(inquiry([message({ body: "짧은 질문" })])),
    ).toBe("짧은 질문");
  });

  it("글 메시지가 없으면 null", () => {
    expect(getOtherInquiryPreview(inquiry([]))).toBeNull();
    expect(
      getOtherInquiryPreview(
        inquiry([message({ kind: "image", body: "url" })]),
      ),
    ).toBeNull();
  });
});

describe("getInquiryTitleKey", () => {
  const card = message({
    kind: "campaignCard",
    campaign: {
      mainImageUrl: null,
      campaignCode: "C1",
      brandName: "빅버드",
      productName: "카드 상품",
    },
  });

  it("캠페인 목록의 상품명을 먼저 쓴다", () => {
    expect(
      getInquiryTitleKey({ ...inquiry([card]), campaignIdx: 10 }, "목록 상품"),
    ).toEqual({ key: "inquiryTitle.campaign", name: "목록 상품" });
  });

  it("목록 응답의 상품명이 있으면 캠페인 목록보다 먼저 쓴다(대화 헤더도 같은 제목)", () => {
    expect(
      getInquiryTitleKey(
        { ...inquiry([]), campaignIdx: 10, productName: "응답 상품" },
        "목록 상품",
      ),
    ).toEqual({ key: "inquiryTitle.campaign", name: "응답 상품" });
  });

  it("목록에 없으면 대화의 캠페인 카드 상품명을 쓴다", () => {
    expect(getInquiryTitleKey({ ...inquiry([card]), campaignIdx: 10 })).toEqual(
      { key: "inquiryTitle.campaign", name: "카드 상품" },
    );
    // 목록의 상품명이 비어 있어도 카드 상품명으로 넘어감.
    expect(
      getInquiryTitleKey({ ...inquiry([card]), campaignIdx: 10 }, " "),
    ).toEqual({ key: "inquiryTitle.campaign", name: "카드 상품" });
  });

  it("이름을 못 찾으면 캠페인 문의는 미확인, 캠페인이 없으면 기타 문의", () => {
    expect(getInquiryTitleKey({ ...inquiry([]), campaignIdx: 10 })).toEqual({
      key: "inquiryTitle.campaignUnknown",
    });
    expect(getInquiryTitleKey(inquiry([]))).toEqual({
      key: "inquiryTitle.other",
    });
  });
});
