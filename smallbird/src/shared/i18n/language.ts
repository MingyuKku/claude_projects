import i18next from "i18next";
import { useTranslation } from "react-i18next";

import { DEFAULT_LANGUAGE, isLanguage, type Language } from "./config";

function toLanguage(value: string | undefined): Language {
  return isLanguage(value) ? value : DEFAULT_LANGUAGE;
}

// 렌더 밖(포맷터)에서 쓰는 현재 언어. 언어가 바뀌어도 알리지 않으므로 갱신은 호출하는 컴포넌트의 리렌더에 맡김.
export function getLanguage(): Language {
  return toLanguage(i18next.language);
}

export function useLanguage(): Language {
  const { i18n } = useTranslation();
  return toLanguage(i18n.language);
}
