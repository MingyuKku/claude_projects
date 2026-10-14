import { useEffect, useRef } from "react";
import useSWRImmutable from "swr/immutable";

import { certInit, KMC_CERT_URL } from "@/features/join";

const CERT_SERVICE_MOBILE = "mobile";
const DEFAULT_TR_ADD = "Y";
/** Lets the values reach the DOM before the form is submitted. */
const SUBMIT_DELAY_MS = 1000;

/**
 * Mobile identity verification. Desktop opens a popup, but popups are often blocked on
 * mobile, so this page itself is submitted to KMC.
 */
export function CertPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const { data: cert } = useSWRImmutable(
    ["cert", "init", CERT_SERVICE_MOBILE],
    () => certInit(CERT_SERVICE_MOBILE),
    { shouldRetryOnError: false },
  );

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
