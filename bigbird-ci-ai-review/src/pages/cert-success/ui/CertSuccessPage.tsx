import { useEffect } from "react";

/**
 * Where the KMC popup returns after verification. It calls the opener's
 * `window.cert_result` and closes itself, so users barely see this screen.
 */
export function CertSuccessPage() {
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
      인증 처리 중...
    </div>
  );
}
