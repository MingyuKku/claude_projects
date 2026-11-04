const DEVICE_ID_KEY = "bigbird.deviceId";
// 백엔드 허용 형식(영문·숫자·-·_ 8~64자, 가이드 2026-11-03 5번 채팅방 잠금).
const DEVICE_ID_PATTERN = /^[\w-]{8,64}$/;

let memoryId: string | undefined;

/**
 * 브라우저(기기) 하나에 한 번 만들어 계속 쓰는 식별자. 실시간 채팅방 잠금이 이 값으로 같은 기기를 알아봄.
 * 저장소를 못 쓰면 이 페이지 안에서만 같은 값을 씀(새로고침하면 다른 기기로 보임).
 */
export function getDeviceId(): string {
  try {
    const saved = localStorage.getItem(DEVICE_ID_KEY);
    if (saved && DEVICE_ID_PATTERN.test(saved)) return saved;
    const id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    memoryId ??= crypto.randomUUID();
    return memoryId;
  }
}

/** 채팅 REST·Firebase 토큰 요청에 붙이는 기기 헤더. */
export function deviceHeaders(): Record<string, string> {
  return { "X-Device-Id": getDeviceId() };
}
