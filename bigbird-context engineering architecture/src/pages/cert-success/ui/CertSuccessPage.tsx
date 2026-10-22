import { useEffect } from "react";

import { useTranslation } from "@/shared/i18n";

/**
 * 인증 뒤 KMC 팝업이 돌아오는 화면. 오프너의 `window.cert_result`를 호출하고
 * 스스로 닫히므로 사용자에게는 거의 보이지 않음.
 */
export function CertSuccessPage() {
  const { t } = useTranslation("pages/cert-success");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    window.opener?.cert_result?.({
      rec_cert: params.get("rec_cert") ?? "",
      certNum: params.get("certNum") ?? "",
    });
    window.close();
  }, []);

  return (
    <div className="flex min-h-dvh items-center justify-center text-gray-700">
      {t("processing")}
    </div>
  );
}
