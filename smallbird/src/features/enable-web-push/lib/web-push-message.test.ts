import "../../../../public/web-push-message.js";
import { isPushReceivedMessage } from "./push-click-message";

interface Built {
  title: string;
  body?: string;
  tag?: string;
  link: string;
}
const webPushMessage = (
  globalThis as unknown as {
    webPushMessage: {
      build: (payload: unknown, languages: string[]) => Built;
      pickLanguage: (languages: string[]) => string;
    };
  }
).webPushMessage;

const approved = {
  data: {
    type: "CAMPAIGN_APPROVED",
    notificationIdx: "5",
    campaignIdx: "12",
    campaignName: "뷰티 체험단",
  },
};

describe("web-push-message", () => {
  it("type으로 문구를 만들고 같은 알림 번호는 같은 tag로 합친다", () => {
    expect(webPushMessage.build(approved, ["ko-KR"])).toEqual({
      title: "캠페인이 승인되었습니다.",
      body: "뷰티 체험단 캠페인이 승인되었습니다.",
      tag: "notification-5",
      link: "/campaign/12",
    });
  });

  it("캠페인명이 없으면 본문을 빼고, 캠페인 번호가 숫자가 아니면 캠페인 현황으로 보낸다", () => {
    const result = webPushMessage.build(
      { data: { type: "CAMPAIGN_REJECTED", campaignIdx: "../x" } },
      ["ko"],
    );

    expect(result.body).toBeUndefined();
    expect(result.link).toBe("/campaign");
  });

  it("모르는 type이어도 알림을 만든다(알림 없는 푸시는 Safari가 권한을 취소함)", () => {
    expect(
      webPushMessage.build({ data: { type: "NEW_KIND" } }, ["ko"]),
    ).toEqual({ title: "bigbird", body: undefined, tag: undefined, link: "/" });
  });

  it.each(["constructor", "toString", "__proto__", "hasOwnProperty"])(
    "type이 Object.prototype 키(%s)여도 모르는 type처럼 일반 알림을 만든다",
    (type) => {
      expect(webPushMessage.build({ data: { type } }, ["ko"])).toEqual({
        title: "bigbird",
        body: undefined,
        tag: undefined,
        link: "/",
      });
    },
  );

  it("브라우저 언어가 Object.prototype 키여도 한국어로 처리한다", () => {
    expect(webPushMessage.pickLanguage(["constructor"])).toBe("ko");
    expect(webPushMessage.build(approved, ["toString"]).title).toBe(
      "캠페인이 승인되었습니다.",
    );
  });

  it("payload를 읽지 못해도 알림을 만든다", () => {
    expect(webPushMessage.build(undefined, ["ko"]).title).toBe("bigbird");
  });

  it("notification payload(콘솔 테스트 메시지)는 그 제목·본문·링크를 쓴다", () => {
    const result = webPushMessage.build(
      {
        notification: { title: "테스트", body: "본문" },
        fcmOptions: { link: "/mypage" },
      },
      ["en"],
    );

    expect(result).toMatchObject({
      title: "테스트",
      body: "본문",
      link: "/mypage",
    });
  });

  it.each([
    [["en-US"], "Campaign approved"],
    [["ja"], "キャンペーン承認"],
    [["zh-TW", "en"], "活动已通过"],
    [["fr-FR"], "캠페인이 승인되었습니다."],
    [["fr", "ja"], "キャンペーン承認"],
  ])("브라우저 언어 %j는 %s 문구를 쓴다", (languages, title) => {
    expect(webPushMessage.build(approved, languages).title).toBe(title);
  });
});

describe("isPushReceivedMessage", () => {
  it("새 푸시 도착 메시지만 true", () => {
    expect(isPushReceivedMessage({ type: "web-push-received" })).toBe(true);
    expect(isPushReceivedMessage({ type: "web-push-click" })).toBe(false);
    expect(isPushReceivedMessage(null)).toBe(false);
  });
});
