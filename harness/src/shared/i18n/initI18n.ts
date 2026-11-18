import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import {
  COMMON_NAMESPACE,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type Language,
} from "./config";

type Resources = Record<string, Record<string, unknown>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectKeys(value: unknown, prefix = ""): string[] {
  if (!isRecord(value)) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    collectKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

// 키가 빠지면 fallback(ko) 문구가 나와 눈에 띄지 않으므로, 개발 환경에서 시작할 때 알림.
function warnMissingKeys(language: Language, resources: Resources) {
  const defaultResources = resources[DEFAULT_LANGUAGE] ?? {};
  for (const [namespace, messages] of Object.entries(defaultResources)) {
    for (const key of collectKeys(messages)) {
      if (i18next.getResource(language, namespace, key) !== undefined) continue;
      console.warn(
        `[i18n] "${language}" 에 "${namespace}:${key}" 키가 없어 ${DEFAULT_LANGUAGE} 문구를 보여 줍니다.`,
      );
    }
  }
}

// resources: 언어 → (namespace → 문구). 결정된 언어와 ko 를 함께 넘김.
export async function initI18n({
  language,
  resources,
}: {
  language: Language;
  resources: Resources;
}): Promise<void> {
  await i18next.use(initReactI18next).init({
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    load: "currentOnly",
    resources: {},
    ns: Object.keys(resources[DEFAULT_LANGUAGE] ?? {}),
    defaultNS: COMMON_NAMESPACE,
    interpolation: { escapeValue: false },
    // 초기화가 끝난 뒤 렌더하므로 Suspense 가 필요 없음.
    react: { useSuspense: false },
    // ko 에도 없는 키(동적 키 오타 등)는 개발 환경에서만 알림.
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: (_languages, namespace, key) => {
      console.warn(`[i18n] "${namespace}:${key}" 키가 없습니다.`);
    },
  });

  for (const [lng, namespaces] of Object.entries(resources)) {
    for (const [namespace, messages] of Object.entries(namespaces)) {
      i18next.addResourceBundle(lng, namespace, messages, true, true);
    }
  }

  if (import.meta.env.DEV && language !== DEFAULT_LANGUAGE) {
    warnMissingKeys(language, resources);
  }
}
