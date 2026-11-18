import type {
  DeletedInquiryMessage,
  InquiryMessageViewModel,
  QnaItemViewModel,
  QnaReplyInfo,
} from "../model/schema";

/**
 * 삭제 API가 돌려준 삭제된 메시지로 대화 속 같은 메시지만 바꿈(대화를 다시 받지 않음). 서버가 본문을 "삭제된 메시지입니다"로,
 * 첨부 정보를 null로 바꿔 주므로 첨부·카드는 없애고 삭제 표시만 남김.
 */
export function applyDeletedMessage(
  messages: InquiryMessageViewModel[],
  deleted: DeletedInquiryMessage,
): InquiryMessageViewModel[] {
  return messages.map((message) =>
    message.id === deleted.messageIdx
      ? {
          ...message,
          kind: "text",
          body: deleted.body,
          isDeleted: true,
          campaign: null,
          attachment: null,
        }
      : message,
  );
}

/** Q&A 답변 삭제 응답으로 그 답변만 삭제 표시로 바꿈. */
export function applyDeletedQnaReply(
  items: QnaItemViewModel[],
  deleted: QnaReplyInfo,
): QnaItemViewModel[] {
  return items.map((item) =>
    item.reply && item.reply.replyIdx === deleted.replyIdx
      ? {
          ...item,
          reply: {
            ...item.reply,
            body: deleted.body ?? item.reply.body,
            isDeleted: true,
          },
        }
      : item,
  );
}
