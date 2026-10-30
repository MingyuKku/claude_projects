import { mergeConversationMessages } from "./merge-messages";

import type { InquiryMessageViewModel } from "@/entities/inquiry";

function message(
  overrides: Partial<InquiryMessageViewModel>,
): InquiryMessageViewModel {
  return {
    id: 1,
    isMine: true,
    kind: "text",
    body: "문의",
    createdAt: new Date("2026-10-01T10:00:00"),
    isDeleted: false,
    isRead: false,
    isEdited: false,
    senderId: null,
    campaign: null,
    attachment: null,
    ...overrides,
  };
}

describe("mergeConversationMessages", () => {
  it("일반 문의 내용 뒤에 실시간 상담 메시지를 시간순으로 잇는다", () => {
    const merged = mergeConversationMessages(
      [message({ id: 5, body: "일반 문의" })],
      [
        message({
          id: 0,
          body: "실시간 문의",
          createdAt: new Date("2026-10-01T10:05:00"),
        }),
      ],
    );

    expect(merged.map((item) => item.body)).toEqual([
      "일반 문의",
      "실시간 문의",
    ]);
  });

  it("양쪽에 있는 메시지는 하나만 남기고 상담 문서 쪽을 쓴다", () => {
    const merged = mergeConversationMessages(
      [message({ id: -1, body: "같은 메시지" })],
      [message({ id: 0, body: "같은 메시지" })],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBeLessThan(0);
  });

  it("상담 문서 메시지의 id가 REST id와 겹치지 않는다", () => {
    const merged = mergeConversationMessages(
      [message({ id: 1, body: "일반 문의" })],
      [message({ id: 1, body: "실시간 문의" })],
    );

    expect(new Set(merged.map((item) => item.id)).size).toBe(2);
  });
});
