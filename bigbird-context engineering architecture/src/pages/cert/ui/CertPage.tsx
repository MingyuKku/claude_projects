import { useEffect, useRef } from "react";

import { KMC_CERT_URL, useCertInit } from "@/features/join";

const CERT_SERVICE_MOBILE = "mobile";
const DEFAULT_TR_ADD = "Y";
/** 폼을 제출하기 전에 값이 DOM에 반영되도록 함. */
const SUBMIT_DELAY_MS = 1000;

/**
 * 모바일 본인인증. 데스크톱은 팝업을 열지만 모바일에서는 팝업이 자주 막혀서
 * 이 페이지 자체를 KMC로 제출함.
 */
export function CertPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const { cert } = useCertInit(CERT_SERVICE_MOBILE);

  useEffect(() => {
    if (!cert) return;
    const timer = setTimeout(() => formRef.current?.submit(), SUBMIT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [cert]);

  return (
    <form ref={formRef} name="requestCert" method="post" action={KMC_CERT_URL}>
      <input type="hidden" name="tr_cert" value={cert?.trCert ?? ""} readOnly />
      <input type="hidden" name="tr_url" value={cert?.trUrl ?? ""} readOnly />
      <input
        type="hidden"
        name="tr_add"
        value={cert?.trAdd ?? DEFAULT_TR_ADD}
        readOnly
      />
    </form>
  );
}
