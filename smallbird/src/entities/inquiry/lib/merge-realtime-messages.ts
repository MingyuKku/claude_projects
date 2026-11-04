import type {
  BigbirdInquiryViewModel,
  InquiryMessageViewModel,
} from "../model/schema";

/**
 * 진행 중인 실시간 상담은 Firestore 상담 문서가 원본이므로, REST 대화에서 그 스레드 메시지를 빼고 문서 메시지로 대체함.
 * 광고주 화면 기준으로 합쳐 시각순으로 돌려줌.
 */
export function mergeRealtimeMessages(
  threads: BigbirdInquiryViewModel[],
  realtimeThreadIdx: number,
  realtimeMessages: InquiryMessageViewModel[],
): InquiryMessageViewModel[] {
  // 마켓이 같은 메시지를 상담 문서에 여러 번 쓰는 경우가 있어(stage 2026-11-02 확인, 메시지 번호는 같고 식별자
  // 뒤 숫자만 다름) 같은 시각·발신·내용이면 하나만 남김. ponytail: 마켓이 고치면 제거.
  const seen = new Set<string>();
  const unique = realtimeMessages.filter((message) => {
    const key = [
      message.createdAt.getTime(),
      message.isMine,
      message.kind,
      message.body,
      message.attachment?.attachmentIdx,
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const live = unique.map((message, index) => ({
    ...message,
    // 변환은 요청자(구매자) 기준 isMine이라 광고주 화면에서는 뒤집음. 캠페인 카드는 대화에서 숨겨 영향 없음.
    isMine: !message.isMine,
    // ponytail: REST messageIdx와 겹치지 않게 음수 id. 음수면 Firestore 메시지라 REST 수정·삭제 대상이 아님.
    id: -(index + 1),
  }));
  return [
    ...threads
      .filter((thread) => thread.threadIdx !== realtimeThreadIdx)
      .flatMap((thread) => thread.messages),
    ...live,
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
