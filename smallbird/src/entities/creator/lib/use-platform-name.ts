import { useTranslation } from "@/shared/i18n";

import type { MatchingPlatform } from "../model/types";

/** 모르는 플랫폼은 서버 이름을 그대로 보임. */
export function usePlatformName() {
  const { t } = useTranslation("entities/creator");
  return ({ code, name }: MatchingPlatform) =>
    code ? t(`platform.${code}`) : name;
}
