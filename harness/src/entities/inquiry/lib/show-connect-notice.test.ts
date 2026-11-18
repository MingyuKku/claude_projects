import { showConnectNotice } from "./show-connect-notice";

import type { InquiryMessageViewModel } from "../model/schema";

function message(
  body: string,
  kind: InquiryMessageViewModel["kind"] = "system",
): InquiryMessageViewModel {
  return {
    id: 1,
    isMine: false,
    kind,
    body,
    createdAt: new Date("2026-11-13T15:47:00"),
    isDeleted: false,
    isRead: false,
    isEdited: false,
    senderId: null,
    campaign: null,
    attachment: null,
  };
}

describe("showConnectNotice", () => {
  it("숨김 처리된 연결 안내를 구분선으로 바꾸고 줄바꿈을 공백으로 바꾼다", () => {
    const result = showConnectNotice(
      message(
        "상담원과 연결되었습니다.\n10분 동안 추가 문의가 없으면 실시간 상담이 자동 종료됩니다.",
      ),
    );
    expect(result.kind).toBe("notice");
    expect(result.body).toBe(
      "상담원과 연결되었습니다. 10분 동안 추가 문의가 없으면 실시간 상담이 자동 종료됩니다.",
    );
  });

  it("다른 자동 안내와 일반 메시지는 그대로 둔다", () => {
    const greeting = message("안녕하세요. 빅버드입니다.");
    const text = message("상담원과 연결되었습니다", "text");
    expect(showConnectNotice(greeting)).toBe(greeting);
    expect(showConnectNotice(text)).toBe(text);
  });
});
