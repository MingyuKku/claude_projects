import { getOtherInquiryPreview } from "./format";

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
