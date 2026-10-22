import type { InquiryMessageViewModel } from "../model/schema";

export type ConversationRow =
  | { type: "message"; id: number; message: InquiryMessageViewModel }
  | {
      type: "files";
      id: number;
      isMine: boolean;
      createdAt: Date;
      /** 바로 앞에서 같은 쪽이 보낸 텍스트. 있으면 같은 말풍선 묶음 아래에 썸네일을 붙임. */
      text: InquiryMessageViewModel | null;
      messages: InquiryMessageViewModel[];
    };

const isFile = (message: InquiryMessageViewModel) =>
  (message.kind === "image" || message.kind === "video") &&
  message.attachment !== null &&
  !message.isDeleted;

const isPlainText = (message: InquiryMessageViewModel) =>
  message.kind === "text" && !message.campaign && !message.isDeleted;

/**
 * 같은 쪽이 연달아 보낸 첨부 메시지를 한 줄로 묶고, 바로 앞의 텍스트가 있으면 그 말풍선 아래에 붙임
 * (시안은 이름 하나 아래 말풍선 + 가로 썸네일 한 줄). 텍스트와 파일마다 메시지가 따로 저장되므로 이렇게
 * 묶어야 한 번에 보낸 글과 파일이 하나의 메시지처럼 보임.
 */
export function groupAttachments(
  messages: readonly InquiryMessageViewModel[],
): ConversationRow[] {
  const rows: ConversationRow[] = [];
  for (const message of messages) {
    if (!isFile(message)) {
      rows.push({ type: "message", id: message.id, message });
      continue;
    }
    const last = rows.at(-1);
    if (last?.type === "files" && last.isMine === message.isMine) {
      last.messages.push(message);
      last.createdAt = message.createdAt;
    } else if (
      last?.type === "message" &&
      isPlainText(last.message) &&
      last.message.isMine === message.isMine
    ) {
      rows[rows.length - 1] = {
        type: "files",
        id: last.id,
        isMine: message.isMine,
        createdAt: message.createdAt,
        text: last.message,
        messages: [message],
      };
    } else {
      rows.push({
        type: "files",
        id: message.id,
        isMine: message.isMine,
        createdAt: message.createdAt,
        text: null,
        messages: [message],
      });
    }
  }
  return rows;
}
