import { applyDeletedMessage, applyDeletedQnaReply } from "./apply-deleted";

import type {
  DeletedInquiryMessage,
  InquiryMessageViewModel,
  QnaItemViewModel,
} from "../model/schema";

const message = (
  id: number,
  overrides: Partial<InquiryMessageViewModel> = {},
): InquiryMessageViewModel => ({
  id,
  isMine: true,
  kind: "text",
  body: `메시지${id}`,
  createdAt: new Date("2026-11-18T10:00"),
  isDeleted: false,
  isRead: false,
  isEdited: false,
  senderId: "mgkang",
  campaign: null,
  attachment: null,
  ...overrides,
});

const deleted = (messageIdx: number): DeletedInquiryMessage => ({
  messageIdx,
  body: "삭제된 메시지입니다",
  deleteTime: "2026-11-18T10:05:00",
});

describe("applyDeletedMessage", () => {
  it("같은 번호의 메시지만 삭제 표시로 바꾸고 나머지 대화는 그대로 둔다", () => {
    const messages = [message(1), message(2), message(3)];
    const result = applyDeletedMessage(messages, deleted(2));
    expect(result[0]).toBe(messages[0]);
    expect(result[2]).toBe(messages[2]);
    expect(result[1]).toMatchObject({
      id: 2,
      isDeleted: true,
      body: "삭제된 메시지입니다",
      kind: "text",
      attachment: null,
      campaign: null,
    });
  });

  it("삭제된 메시지의 첨부는 없앤다", () => {
    const withFile = message(2, {
      kind: "file",
      attachment: {
        attachmentIdx: 9,
        fileName: "a.pdf",
        fileSize: 1,
        fileType: "application/pdf",
      },
    });
    expect(applyDeletedMessage([withFile], deleted(2))[0]).toMatchObject({
      kind: "text",
      attachment: null,
    });
  });

  it("번호가 없는 메시지는 건드리지 않는다", () => {
    const messages = [message(1)];
    expect(applyDeletedMessage(messages, deleted(99))).toEqual(messages);
  });
});

describe("applyDeletedQnaReply", () => {
  const item = (replyIdx: number | null): QnaItemViewModel => ({
    inquiryIdx: 1,
    productName: null,
    productImageUrl: null,
    optionName: null,
    inquiryType: null,
    question: { body: "질문", writtenAt: new Date(), isDeleted: false },
    reply:
      replyIdx === null
        ? null
        : {
            replyIdx,
            body: "답변",
            writtenAt: null,
            isRead: false,
            isDeleted: false,
          },
  });

  it("그 답변만 삭제 표시로 바꾼다", () => {
    const items = [item(5), item(null), item(6)];
    const result = applyDeletedQnaReply(items, {
      replyIdx: 5,
      body: "삭제된 메시지입니다",
    });
    expect(result[0]!.reply).toMatchObject({
      replyIdx: 5,
      isDeleted: true,
      body: "삭제된 메시지입니다",
    });
    expect(result[1]).toBe(items[1]);
    expect(result[2]).toBe(items[2]);
  });
});
