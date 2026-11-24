// 서버가 보낸 웹푸시 payload로 알림 문구와 이동 경로를 만드는 코드. Service Worker가 importScripts로 불러오고,
// 테스트가 같은 파일을 직접 불러옴(Service Worker는 모듈을 쓸 수 없어 전역 `webPushMessage`에 둠).
// 서버는 제목·문구 없이 `type` 코드만 보내므로 여기서 만든다. 문구는 앱의 알림 목록(widgets/app-shell 번역)과 같게 유지함.
(function (root) {
  var TEXTS = {
    ko: {
      CAMPAIGN_APPROVED: {
        title: "캠페인이 승인되었습니다.",
        body: "{name} 캠페인이 승인되었습니다.",
      },
      CAMPAIGN_REJECTED: {
        title: "캠페인이 반려되었습니다.",
        body: "{name} 캠페인이 반려되었습니다.",
      },
    },
    en: {
      CAMPAIGN_APPROVED: {
        title: "Campaign approved",
        body: "{name} has been approved.",
      },
      CAMPAIGN_REJECTED: {
        title: "Campaign rejected",
        body: "{name} has been rejected.",
      },
    },
    ja: {
      CAMPAIGN_APPROVED: {
        title: "キャンペーン承認",
        body: "{name}が承認されました。",
      },
      CAMPAIGN_REJECTED: {
        title: "キャンペーン差し戻し",
        body: "{name}が差し戻されました。",
      },
    },
    "zh-CN": {
      CAMPAIGN_APPROVED: {
        title: "活动已通过",
        body: "{name}已通过审核。",
      },
      CAMPAIGN_REJECTED: {
        title: "活动已驳回",
        body: "{name}已被驳回。",
      },
    },
  };
  var FALLBACK_LANGUAGE = "ko";

  // 서버·브라우저가 준 값으로 조회하므로 constructor·toString 같은 Object.prototype 키가 일치하지 않게 자기 키만 봄.
  function ownValue(map, key) {
    return typeof key === "string" &&
      Object.prototype.hasOwnProperty.call(map, key)
      ? map[key]
      : undefined;
  }
  var CAMPAIGN_LIST_PATH = "/campaign";

  // Service Worker는 앱에서 고른 언어를 읽을 수 없어 브라우저 언어를 따름. 지원하지 않는 언어는 한국어.
  function pickLanguage(languages) {
    for (var i = 0; i < languages.length; i += 1) {
      var code = String(languages[i]).toLowerCase();
      if (code.indexOf("zh") === 0) return "zh-CN";
      var base = code.split("-")[0];
      if (ownValue(TEXTS, base)) return base;
    }
    return FALLBACK_LANGUAGE;
  }

  // 알림을 눌렀을 때 갈 경로. 캠페인 번호가 숫자가 아니면 캠페인 현황으로 보냄(경로를 깨뜨리지 않게 숫자만 씀).
  function buildLink(campaignIdx) {
    return /^\d+$/.test(campaignIdx || "")
      ? CAMPAIGN_LIST_PATH + "/" + campaignIdx
      : CAMPAIGN_LIST_PATH;
  }

  var FALLBACK_TITLE = "bigbird";
  var HOME_PATH = "/";

  // 푸시는 항상 알림을 띄워야 함(Safari는 알림 없는 푸시를 허용하지 않고, 어기면 푸시 권한을 취소함. Chrome도 기본 알림을 대신 띄움).
  // 그래서 만들 수 없는 푸시도 null 없이 알림 하나로 바꿈: 아는 type이면 문구를 만들고, 아니면 payload의 notification
  // (콘솔 테스트 메시지 등)을, 그것도 없으면 앱 이름만 있는 일반 알림.
  function build(payload, languages) {
    var data = (payload && payload.data) || {};
    var notification = (payload && payload.notification) || {};
    var texts = ownValue(TEXTS[pickLanguage(languages)], data.type);

    if (texts) {
      return {
        title: texts.title,
        body: data.campaignName
          ? texts.body.replace("{name}", data.campaignName)
          : undefined,
        // 같은 알림 번호의 푸시는 브라우저가 한 개로 합침.
        tag: data.notificationIdx
          ? "notification-" + data.notificationIdx
          : undefined,
        link: buildLink(data.campaignIdx),
      };
    }
    return {
      title: notification.title || data.title || FALLBACK_TITLE,
      body: notification.body || data.body,
      tag: undefined,
      link:
        (payload && payload.fcmOptions && payload.fcmOptions.link) ||
        data.link ||
        HOME_PATH,
    };
  }

  root.webPushMessage = { build: build, pickLanguage: pickLanguage };
})(self);
