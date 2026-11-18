import type { InquiryMessageViewModel } from "../model/schema";

// 운영 앱이 상담을 수락할 때 남기는 auto 안내의 시작 문구. 뒤에 "10분 동안 추가 문의가 없으면…"이 `</br>`로 이어짐.
const CONNECT_NOTICE_PREFIX = "상담원과 연결되었습니다";

/**
 * 연결 안내(auto)는 다른 자동 안내처럼 숨김(system)으로 오는데, 종료 안내처럼 대화에 구분선(notice)으로 보이게 함
 * (사용자 결정 2026-11-13, 시안에는 없음). 줄바꿈은 한 줄 칩으로 보이게 공백으로 바꿈.
 */
export function showConnectNotice(
  message: InquiryMessageViewModel,
): InquiryMessageViewModel {
  if (
    message.kind !== "system" ||
    !message.body.trim().startsWith(CONNECT_NOTICE_PREFIX)
  )
    return message;
  return {
    ...message,
    kind: "notice",
    body: message.body.replace(/\s*\n\s*/g, " ").trim(),
  };
}
