import { useEffect, useRef } from "react";

import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { KMC_RESULT_PARAMS, takeKmcReturnPath } from "@/shared/lib";

/** 오프너가 다른 출처면 접근 자체가 예외라 없는 것으로 봄. */
function readOpenerCallback(): Window["cert_result"] {
  try {
    return (window.opener as Window | null)?.cert_result;
  } catch {
    return undefined;
  }
}

/**
 * 인증 뒤 KMC가 돌아오는 화면. 사용자에게는 거의 보이지 않음.
 * - 팝업(PC): 오프너의 `window.cert_result`를 호출하고 스스로 닫힘.
 * - 페이지 이동(모바일): 오프너가 없으므로 이동 전에 저장한 화면으로 결과 쿼리를 붙여 돌려보냄.
 */
export function CertSuccessPage() {
  const { t } = useTranslation("pages/cert-success");
  /** StrictMode에서 effect가 두 번 돌아도 결과를 한 번만 넘김. `window.close()`는 바로 닫지 않아 두 번째 호출을 막지 못함. */
  const hasDeliveredRef = useRef(false);

  useEffect(() => {
    if (hasDeliveredRef.current) return;
    hasDeliveredRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const recCert = params.get(KMC_RESULT_PARAMS.recCert) ?? "";
    const certNum = params.get(KMC_RESULT_PARAMS.certNum) ?? "";
    const openerCallback = readOpenerCallback();
    if (openerCallback) {
      openerCallback({ rec_cert: recCert, certNum });
      window.close();
      return;
    }
    const returnUrl = new URL(
      takeKmcReturnPath() ?? ROUTES.home,
      window.location.origin,
    );
    returnUrl.searchParams.set(KMC_RESULT_PARAMS.recCert, recCert);
    returnUrl.searchParams.set(KMC_RESULT_PARAMS.certNum, certNum);
    // KMC 화면으로 뒤로 가지 않게 기록을 바꿔 치움.
    window.location.replace(returnUrl.pathname + returnUrl.search);
  }, []);

  return (
    <div className="flex min-h-dvh items-center justify-center text-gray-700">
      {t("processing")}
    </div>
  );
}
