// i18next·react-i18next 는 이 폴더에서만 임포트함(ESLint no-restricted-imports).
export { Trans, useTranslation } from "react-i18next";

export {
  COMMON_NAMESPACE,
  DEFAULT_LANGUAGE,
  isLanguage,
  SUPPORTED_LANGUAGES,
  type Language,
} from "./config";
export { formatDate, formatNumber } from "./format";
export { initI18n } from "./initI18n";
export { useLanguage } from "./language";
export { resolveLanguage } from "./resolveLanguage";
