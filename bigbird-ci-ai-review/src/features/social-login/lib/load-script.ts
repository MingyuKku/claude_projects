import {
  APPLE_SCRIPT_ID,
  APPLE_SCRIPT_SRC,
  GOOGLE_SCRIPT_ID,
  GOOGLE_SCRIPT_SRC,
  KAKAO_SCRIPT_SRC,
  NAVER_SCRIPT_SRC,
} from "../model/constants";
import "../model/sdk-types";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error(`스크립트를 불러오지 못했습니다: ${src}`));
    document.head.appendChild(script);
  });
}

export function loadNaverScript(): Promise<void> {
  return loadScript(NAVER_SCRIPT_SRC);
}

export function loadKakaoScript(): Promise<void> {
  return loadScript(KAKAO_SCRIPT_SRC);
}

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

// Loaded on demand: the other routes never use it, so it must not weigh on them.
export function loadAppleScript(): Promise<void> {
  if (document.getElementById(APPLE_SCRIPT_ID)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = APPLE_SCRIPT_ID;
    script.src = APPLE_SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("애플 SDK 를 불러오지 못했습니다"));
    document.head.appendChild(script);
  });
}
