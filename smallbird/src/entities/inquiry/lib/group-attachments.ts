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
  (message.kind === "image" ||
    message.kind === "video" ||
    message.kind === "file") &&
  message.attachment !== null &&
  !message.isDeleted;

// 첨부 메시지의 body는 보통 파일 주소임. 출금 요청 접수처럼 서버가 글과 첨부를 한 메시지로 저장하면 body가 글임.
// 주소는 스킴(`https://`·`blob:`·`data:`)이나 `/`로 시작하거나, 공백 없는 상대 경로(`upload/a.png`)임.
const FILE_URL = /^(?:[a-z][a-z0-9+.-]*:\/\/|blob:|data:|\/)|^\S+\/\S+$/i;

/** 첨부 메시지의 body가 파일 주소가 아니라 같이 보낸 글인지. */
export const hasOwnText = (message: InquiryMessageViewModel) =>
  isFile(message) && message.body.trim() !== "" && !FILE_URL.test(message.body);

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
    if (hasOwnText(message)) {
      rows.push({
        type: "files",
        id: message.id,
        isMine: message.isMine,
        createdAt: message.createdAt,
        // 첨부가 달린 메시지는 본문 수정·삭제 대상이 아니라서 임시 id(≤ 0)로 둠.
        text: { ...message, id: -message.id, kind: "text", attachment: null },
        messages: [message],
      });
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
