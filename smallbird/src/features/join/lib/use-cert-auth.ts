import { tryit } from "radash";
import { useRef, useState } from "react";

import {
  fetchKmcRequestToken,
  openKmcPopup,
  useKmcPopupResult,
} from "@/shared/lib";

import { certDecrypt } from "../api/join-api";
import { readApiErrorMessage } from "./api-error";

import type { CertSuccess } from "../model/store";
import type { KmcRequestToken } from "@/shared/lib";

export type CertResult =
  | { status: "idle" }
  | ({ status: "success" } & CertSuccess)
  /** The phone number is already registered. */
  | { status: "exists"; message: string }
  | { status: "fail"; message: string };

/**
 * KMC phone verification. KMC POSTs a form into a popup and, when done, that window
 * calls the opener's `window.cert_result`, so a global callback is required by the
 * provider, not by our choice.
 */
export function useCertAuth(onSuccess: (success: CertSuccess) => void) {
  const [result, setResult] = useState<CertResult>({ status: "idle" });
  const [isPopupBlocked, setIsPopupBlocked] = useState(false);
  /** The KMC request token is fetched once and reused. */
  const certToken = useRef<KmcRequestToken | null>(null);

  useKmcPopupResult(({ recCert, certNum }) => {
    void (async () => {
      const [error, data] = await tryit(certDecrypt)(recCert, certNum);
      if (error) {
        setResult({ status: "fail", message: readApiErrorMessage(error) });
        return;
      }
      if (data.result === "fail" || data.result === false) {
        setResult({ status: "fail", message: data.message ?? "" });
        return;
      }
      if (data.result === "same" || data.result === "exists") {
        setResult({ status: "exists", message: data.message ?? "" });
        return;
      }
      const success = {
        certIdx: data.certIdx ?? null,
        name: data.name ?? "",
        phoneNumber: data.phoneNumber ?? "",
      };
      setResult({ status: "success", ...success });
      onSuccess(success);
    })();
  });

  async function open() {
    setIsPopupBlocked(false);
    if (!certToken.current) {
      const [error, token] = await tryit(fetchKmcRequestToken)();
      if (error) {
        setResult({ status: "fail", message: readApiErrorMessage(error) });
        return;
      }
      certToken.current = token;
    }
    if (!openKmcPopup(certToken.current)) setIsPopupBlocked(true);
  }

  return { result, open, isPopupBlocked, setIsPopupBlocked };
}
