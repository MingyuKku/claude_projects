import {
  APPLE_SCRIPT_ID,
  APPLE_SCRIPT_SRC,
  GOOGLE_SCRIPT_ID,
  GOOGLE_SCRIPT_SRC,
} from "../model/constants";
import "../model/sdk-types";

export function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(GOOGLE_SCRIPT_ID)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_SRC;
    script.onload = () =>
      window.google?.accounts
        ? resolve()
        : reject(new Error("구글 SDK 를 불러왔지만 accounts 가 없습니다"));
    script.onerror = () => reject(new Error("구글 SDK 를 불러오지 못했습니다"));
    document.head.appendChild(script);
  });
}

let appleScriptPromise: Promise<void> | null = null;

// 팝업은 클릭 직후에 열려야 차단되지 않아서 화면에 들어올 때 미리 불러 둠. 중복 호출은 같은 요청을 기다리게 함.
export function loadAppleScript(): Promise<void> {
  if (window.AppleID) return Promise.resolve();
  appleScriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = APPLE_SCRIPT_ID;
    script.src = APPLE_SCRIPT_SRC;
    script.onload = () =>
      window.AppleID
        ? resolve()
        : reject(new Error("애플 SDK 를 불러왔지만 AppleID 가 없습니다"));
    script.onerror = () => reject(new Error("애플 SDK 를 불러오지 못했습니다"));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    // 실패하면 다시 눌렀을 때 새로 시도함.
    appleScriptPromise = null;
    document.getElementById(APPLE_SCRIPT_ID)?.remove();
    throw error;
  });
  return appleScriptPromise;
}
