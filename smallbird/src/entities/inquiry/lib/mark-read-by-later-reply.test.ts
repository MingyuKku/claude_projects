import { markReadByLaterReply } from "./mark-read-by-later-reply";

import type { InquiryMessageViewModel } from "../model/schema";

function message(
  id: number,
  isMine: boolean,
  kind: InquiryMessageViewModel["kind"] = "text",
  isRead = false,
): InquiryMessageViewModel {
  return {
    id,
    isMine,
    kind,
    body: String(id),
    createdAt: new Date(`2026-11-12T14:${String(id).padStart(2, "0")}:00`),
    isDeleted: false,
    isRead,
    isEdited: false,
    senderId: null,
    campaign: null,
    attachment: null,
  };
}

const readFlags = (messages: InquiryMessageViewModel[]) =>
  messages.map((item) => item.isRead);

describe("markReadByLaterReply", () => {
  it("상대가 그 뒤에 글을 보낸 내 메시지만 읽은 것으로 본다", () => {
    const result = markReadByLaterReply([
      message(1, false),
      message(2, true), // 뒤에 상대 글이 있음 → 읽음
      message(3, false),
      message(4, true), // 뒤에 상대 글이 없음 → 그대로
    ]);
    expect(readFlags(result)).toEqual([false, true, false, false]);
  });

  it("상대가 첨부만 보내도 답한 것으로 센다", () => {
    const result = markReadByLaterReply([
      message(1, true),
      message(2, false, "image"),
    ]);
    expect(readFlags(result)).toEqual([true, false]);
  });

  it("종료 안내·자동 메시지는 상대가 보낸 글로 세지 않는다", () => {
    const result = markReadByLaterReply([
      message(1, true),
      message(2, false, "notice"),
      message(3, false, "system"),
    ]);
    expect(readFlags(result)).toEqual([false, false, false]);
  });

  it("서버가 이미 읽음으로 준 메시지와 입력 배열은 바꾸지 않는다", () => {
    const input = [message(1, true, "text", true), message(2, false)];
    const result = markReadByLaterReply(input);
    expect(result[0]).toBe(input[0]);
    expect(readFlags(input)).toEqual([true, false]);
  });
});
