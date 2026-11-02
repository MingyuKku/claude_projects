import type { InquiryMessageViewModel } from "@/entities/inquiry";

// 상담 문서(Firestore) 메시지의 id는 목록 순번이라 REST id와 겹칠 수 있음. 겹치지 않고 수정·삭제도 안 되는(id <= 0) 범위로 옮김.
const LIVE_ID_OFFSET = 1_000_000;

// 같은 메시지를 REST(타임라인·스레드)와 상담 문서가 모두 갖고 있을 때 알아보는 키. 초 단위까지 같은 시각·발신·본문.
function toKey(message: InquiryMessageViewModel) {
  return `${message.isMine}|${Math.floor(message.createdAt.getTime() / 1000)}|${message.body}`;
}

/**
 * 같은 대화창에 일반 문의 내용과 실시간 상담을 함께 보이게 이음. `history`는 REST 쪽(타임라인 또는 스레드 메시지),
 * `live`는 상담 문서를 실시간 구독한 메시지. 둘 다 가진 메시지는 `live`를 남기고 시간순으로 정렬함.
 */
export function mergeConversationMessages(
  history: InquiryMessageViewModel[],
  live: InquiryMessageViewModel[],
) {
  const liveKeys = new Set(live.map(toKey));
  const liveMessages = live.map((message, index) => ({
    ...message,
    id: -(LIVE_ID_OFFSET + index),
  }));
  return [
    ...history.filter((message) => !liveKeys.has(toKey(message))),
    ...liveMessages,
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
