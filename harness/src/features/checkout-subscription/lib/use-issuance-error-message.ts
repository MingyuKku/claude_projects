import { useTranslation } from "@/shared/i18n";

import { toIssuanceErrorKey } from "./issuance-error";

/** 구독 시작 에러 코드를 사용자 문구로 바꿈. 모르는 코드는 일반 오류 문구. */
export function useIssuanceErrorMessage() {
  const { t } = useTranslation("features/checkout-subscription");
  const { t: tCommon } = useTranslation();

  return (reason: string | null | undefined) => {
    const key = toIssuanceErrorKey(reason);
    return key ? t(key) : tCommon("error.unexpected");
  };
}
