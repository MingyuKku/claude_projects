// FCM 웹푸시를 받아 알림을 띄우는 Service Worker. Firebase SDK 없이 push 이벤트를 직접 처리하며,
// SDK(getToken)가 루트의 이 파일 이름으로 등록함. 서버는 문구 없는 data 메시지만 보내서
// 문구·이동 경로는 web-push-message.js가 type으로 만듦.
importScripts("/web-push-message.js");

const ICON_URL = "/favicon.png";
// 앱 창에 새 알림이 왔다고 알리는 메시지 종류(앱의 `push-click-message.ts`와 같은 값).
const PUSH_RECEIVED_MESSAGE_TYPE = "web-push-received";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function readPayload(event) {
  try {
    return event.data?.json();
  } catch {
    return undefined;
  }
}

function listAppWindows() {
  return self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((windows) =>
      windows.filter(
        (client) => new URL(client.url).origin === self.location.origin,
      ),
    );
}

// 푸시를 받으면 앱 창이 보이든 말든, 모르는 type이든 항상 알림을 띄움. Safari는 알림 없는 푸시를 허용하지 않고
// 어기면 푸시 권한을 취소하며, 알림을 가능한 한 일찍 띄워야 함(앱 창 조회를 기다리지 않음). Firebase SDK의
// onMessage는 SDK의 Service Worker 메시지만 받아서 이 워커에서는 쓰지 못해, 열려 있는 앱 창에는 메시지로 알려
// 목록을 다시 읽게 함.
self.addEventListener("push", (event) => {
  const message = self.webPushMessage.build(
    readPayload(event),
    self.navigator.languages ?? [self.navigator.language],
  );

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(message.title, {
        body: message.body,
        icon: ICON_URL,
        tag: message.tag,
        data: { link: message.link },
      }),
      listAppWindows().then((windows) =>
        windows.forEach((client) =>
          client.postMessage({ type: PUSH_RECEIVED_MESSAGE_TYPE }),
        ),
      ),
    ]),
  );
});

// 서버가 준 링크라도 같은 출처의 경로만 쓰고, 그 밖에는 홈으로 보냄.
function resolveSameOriginPath(link) {
  try {
    const url = new URL(link ?? "/", self.location.origin);
    return url.origin === self.location.origin
      ? `${url.pathname}${url.search}${url.hash}`
      : "/";
  } catch {
    return "/";
  }
}

// 앱 창은 이 워커가 제어하는 창이 아니라서(SDK가 별도 범위로 등록함) WindowClient.navigate()가 거부됨.
// 열려 있는 앱 창은 앞으로 가져오고, 이동은 메시지로 앱에 맡김(앱의 usePushClickNavigation이 받음).
async function openOrFocus(path) {
  const [appWindow] = await listAppWindows();
  if (!appWindow) return self.clients.openWindow(path);
  await appWindow.focus();
  appWindow.postMessage({ type: "web-push-click", link: path });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    openOrFocus(resolveSameOriginPath(event.notification.data?.link)),
  );
});
