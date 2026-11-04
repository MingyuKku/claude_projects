interface BrowserNotificationInput {
  title: string;
  body?: string | null;
  icon?: string | null;
  onClick?: () => void;
}

/**
 * 크롬(데스크톱) 알림을 띄움. 권한을 아직 묻지 않았으면 이때 묻고(v2와 같음), 거부됐거나 지원하지 않는
 * 브라우저면 아무것도 하지 않음. 누르면 이 탭으로 돌아와 `onClick`을 부름.
 */
export async function showBrowserNotification({
  title,
  body,
  icon,
  onClick,
}: BrowserNotificationInput) {
  if (typeof Notification === "undefined") return;
  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  if (permission !== "granted") return;
  const notification = new Notification(title, {
    body: body ?? undefined,
    icon: icon ?? undefined,
  });
  notification.onclick = () => {
    window.focus();
    onClick?.();
    notification.close();
  };
}
