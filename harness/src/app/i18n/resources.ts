import { DEFAULT_LANGUAGE, type Language } from "@/shared/i18n";

import { parseLocalePath } from "./localePath";

type Messages = Record<string, unknown>;

// ko 는 번들에 바로 넣고, 다른 언어는 결정된 언어의 파일만 불러옴.
const defaultModules = import.meta.glob<unknown>("/src/**/locales/ko.json", {
  eager: true,
  import: "default",
});
const lazyModules = import.meta.glob<unknown>(
  ["/src/**/locales/*.json", "!/src/**/locales/ko.json"],
  { import: "default" },
);

export function collectDefaultResources(): Messages {
  const messages: Messages = {};
  for (const [path, value] of Object.entries(defaultModules)) {
    const location = parseLocalePath(path);
    if (location) messages[location.namespace] = value;
  }
  return messages;
}

async function loadLanguageResources(language: Language): Promise<Messages> {
  const entries = await Promise.all(
    Object.entries(lazyModules).flatMap(([path, load]) => {
      const location = parseLocalePath(path);
      if (location?.language !== language) return [];
      return [load().then((value) => [location.namespace, value] as const)];
    }),
  );
  return Object.fromEntries(entries);
}

// 불러오기에 실패하면 ko 로 렌더함. 저장된 언어 값은 그대로 둠.
export async function loadResources(language: Language): Promise<{
  language: Language;
  resources: Record<string, Messages>;
}> {
  const resources = { [DEFAULT_LANGUAGE]: collectDefaultResources() };
  if (language === DEFAULT_LANGUAGE) return { language, resources };
  try {
    resources[language] = await loadLanguageResources(language);
    return { language, resources };
  } catch (error) {
    console.error(`[i18n] "${language}" 리소스를 불러오지 못했습니다.`, error);
    return { language: DEFAULT_LANGUAGE, resources };
  }
}
