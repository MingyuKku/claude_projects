import i18next from "i18next";

import { COMMON_NAMESPACE, type Language } from "./config";

// namespace → 문구
type LanguageLoader = (language: Language) => Promise<Record<string, unknown>>;

// 리소스 파일 위치는 app 이 알므로, 언어별 리소스를 불러오는 함수를 app 이 등록함.
let loadLanguage: LanguageLoader | null = null;
// 불러오는 중인 언어. 같은 언어를 다시 고르면 같은 요청을 기다림.
const loadingLanguages = new Map<Language, Promise<boolean>>();
// 가장 나중에 고른 언어. 먼저 고른 언어의 로딩이 늦게 끝나도 마지막 선택이 이기게 함.
let latestRequested: Language | null = null;

export function registerLanguageLoader(loader: LanguageLoader) {
  loadLanguage = loader;
}

async function loadAndRegister(language: Language): Promise<boolean> {
  if (!loadLanguage) return false;
  try {
    const namespaces = await loadLanguage(language);
    for (const [namespace, messages] of Object.entries(namespaces)) {
      i18next.addResourceBundle(language, namespace, messages, true, true);
    }
    return true;
  } catch (error) {
    console.error(`[i18n] "${language}" 리소스를 불러오지 못했습니다.`, error);
    return false;
  }
}

function ensureLoaded(language: Language): Promise<boolean> {
  if (i18next.hasResourceBundle(language, COMMON_NAMESPACE)) {
    return Promise.resolve(true);
  }
  const pending =
    loadingLanguages.get(language) ??
    loadAndRegister(language).finally(() => loadingLanguages.delete(language));
  loadingLanguages.set(language, pending);
  return pending;
}

// 불러오지 못하면 현재 언어를 그대로 둠.
export async function changeLanguage(language: Language): Promise<void> {
  latestRequested = language;
  const isLoaded = await ensureLoaded(language);
  if (!isLoaded || latestRequested !== language) return;
  if (language === i18next.language) return;
  await i18next.changeLanguage(language);
}

// 언어가 바뀐 뒤 <html lang>·폰트·저장처럼 언어 밖의 일을 맞출 때 씀. 해제 함수를 돌려줌.
export function onLanguageChanged(listener: (language: string) => void) {
  i18next.on("languageChanged", listener);
  return () => i18next.off("languageChanged", listener);
}
