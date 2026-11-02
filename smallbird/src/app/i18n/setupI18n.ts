import { initI18n, resolveLanguage } from "@/shared/i18n";

import { loadLanguageFont } from "./fonts";
import { loadResources } from "./resources";

const STORAGE_KEY = "bigbird.lng";

// 사생활 보호 모드 등에서 localStorage 접근이 예외를 던지면 저장값이 없는 것으로 처리함.
function readStoredLanguage(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeLanguage(language: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // 저장하지 못해도 이번 접속은 요청한 언어로 보여 줌.
  }
}

// 언어는 시작할 때 한 번만 정함. 렌더 전에 끝내야 한국어 → 다른 언어 깜빡임이 없음.
export async function setupI18n(): Promise<void> {
  const query = new URLSearchParams(window.location.search).get("lng");
  const requested = resolveLanguage({
    query,
    stored: readStoredLanguage(),
    browser: navigator.languages,
  });
  // ?lng= 는 지원 언어일 때만 결과가 그 값과 같으므로, 같을 때만 저장함.
  if (requested === query) storeLanguage(requested);

  const { language, resources } = await loadResources(requested);
  await initI18n({ language, resources });
  document.documentElement.lang = language;
  loadLanguageFont(language);
}
