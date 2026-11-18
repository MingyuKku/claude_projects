import type { InquiryMessageViewModel } from "../model/schema";

/**
 * 임시 규칙(2026-11-12): 상대가 내 메시지 뒤에 메시지를 보냈으면 읽은 것으로 봄. 인플루언서 앱이 읽음을 서버에 알리지 않아
 * 내가 보낸 메시지의 `readTime`이 계속 null이라 이미 읽힌 메시지에도 수정·삭제 버튼이 뜨던 문제를 덮음.
 * 서버가 읽음을 채우면(백엔드 확인 대기) 이 파일과 호출하는 곳 한 줄을 지움.
 * 메시지는 시간순이어야 하고, 안내·자동 메시지는 상대가 보낸 글로 세지 않음.
 */
export function markReadByLaterReply(messages: InquiryMessageViewModel[]) {
  const result = [...messages];
  let hasLaterReply = false;
  for (let index = result.length - 1; index >= 0; index -= 1) {
    const message = result[index];
    if (!message) continue;
    if (!message.isMine) {
      hasLaterReply ||= message.kind !== "notice" && message.kind !== "system";
    } else if (hasLaterReply && !message.isRead) {
      result[index] = { ...message, isRead: true };
    }
  }
  return result;
}
