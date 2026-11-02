import { COMMON_NAMESPACE, isLanguage, type Language } from "@/shared/i18n";

const COMMON_PATTERN = /^\/src\/shared\/i18n\/locales\/([^/]+)\.json$/;
const SLICE_PATTERN =
  /^\/src\/(pages|widgets|features|entities)\/([^/]+)\/locales\/([^/]+)\.json$/;

// 파일 경로에서 namespace 를 정함. 허용하지 않은 위치는 undefined (pnpm i18n:check 가 막음).
// scripts/i18n.mjs 의 경로 규칙과 같게 유지함.
export function parseLocalePath(
  path: string,
): { namespace: string; language: Language } | undefined {
  const common = COMMON_PATTERN.exec(path);
  if (common) {
    return isLanguage(common[1])
      ? { namespace: COMMON_NAMESPACE, language: common[1] }
      : undefined;
  }
  const slice = SLICE_PATTERN.exec(path);
  if (slice) {
    return isLanguage(slice[3])
      ? { namespace: `${slice[1]}/${slice[2]}`, language: slice[3] }
      : undefined;
  }
  return undefined;
}
