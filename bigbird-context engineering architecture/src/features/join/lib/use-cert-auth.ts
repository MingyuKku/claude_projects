import { tryit } from "radash";
import { useEffect, useRef, useState } from "react";

import { CERT_SLUG } from "@/shared/config";

import { certDecrypt, certInit } from "../api/join-api";
import {
  KMC_CERT_URL,
  KMC_POPUP_FEATURES,
  KMC_POPUP_NAME,
} from "../model/constants";
import { readApiErrorMessage } from "./api-error";

import type { CertInitResult } from "../model/schema";
import type { CertSuccess } from "../model/store";

export type CertResult =
  | { status: "idle" }
  | ({ status: "success" } & CertSuccess)
  /** The phone number is already registered. */
  | { status: "exists"; message: string }
  | { status: "fail"; message: string };

declare global {
  interface Window {
    /** KMC contract: the popup calls this on the opener when verification ends. */
    cert_result?: (data: { rec_cert: string; certNum: string }) => void;
  }
}

/**
 * KMC phone verification. KMC POSTs a form into a popup and, when done, that window
 * calls the opener's `window.cert_result`, so a global callback is required by the
 * provider, not by our choice.
 */
export function useCertAuth(onSuccess: (success: CertSuccess) => void) {
  const [result, setResult] = useState<CertResult>({ status: "idle" });
  const [isPopupBlocked, setIsPopupBlocked] = useState(false);
  /** `/cert/init` is fetched once and reused. */
  const certToken = useRef<CertInitResult | null>(null);

  useEffect(() => {
    // The argument key (rec_cert) is KMC's name; take the object and map it to ours.
    window.cert_result = (certResponse) => {
      void (async () => {
        const [error, data] = await tryit(certDecrypt)(
          certResponse.rec_cert,
          certResponse.certNum,
        );
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
    };
    return () => {
      delete window.cert_result;
    };
  }, [onSuccess]);

  async function open() {
    setIsPopupBlocked(false);
    if (!certToken.current) {
      const [error, token] = await tryit(certInit)(CERT_SLUG);
      if (error) {
        setResult({ status: "fail", message: readApiErrorMessage(error) });
        return;
      }
      certToken.current = token;
    }
    const { trCert, trUrl, trAdd } = certToken.current;

    const popup = window.open("", KMC_POPUP_NAME, KMC_POPUP_FEATURES);
    if (!popup) {
      setIsPopupBlocked(true);
      return;
    }

    // KMC does not accept GET, so a form is POSTed into the popup.
    const form = document.createElement("form");
    form.method = "post";
    form.action = KMC_CERT_URL;
    form.target = KMC_POPUP_NAME;
    const fields: [string, string][] = [
      ["tr_cert", trCert],
      ["tr_url", trUrl],
      ["tr_add", trAdd],
    ];
    for (const [name, value] of fields) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
    form.remove();
  }

  return { result, open, isPopupBlocked, setIsPopupBlocked };
}
