import { tryit } from "radash";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router";

import {
  KMC_RESULT_PARAMS,
  openKmcPopup,
  redirectToKmc,
  useKmcPopupResult,
  useMediaQuery,
} from "@/shared/lib";

import { decryptCertResult, fetchCertToken } from "../api/cert-api";
import {
  saveProfileDraft,
  takeProfileDraft,
  toPhoneVerificationState,
} from "./phone-verification";

import type {
  PhoneVerificationState,
  ProfileDraft,
} from "./phone-verification";
import type { KmcResult } from "@/shared/lib";

/** 터치 기기는 팝업이 막히거나 새 탭으로 열려 페이지 이동으로 인증함. */
const TOUCH_MEDIA_QUERY = "(pointer: coarse)";

/**
 * 휴대폰 변경용 KMC 본인인증. PC는 팝업, 터치 기기는 페이지 이동 뒤 결과 쿼리(`rec_cert`·`certNum`)를 달고 돌아옴.
 * 인증만 하고 서버 반영은 폼의 "저장"이 `certIdx`로 함(v2와 같음).
 */
export function usePhoneVerification(
  onRestoreDraft: (draft: ProfileDraft) => void,
) {
  const [state, setState] = useState<PhoneVerificationState>({
    status: "idle",
  });
  const isTouch = useMediaQuery(TOUCH_MEDIA_QUERY);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  /** StrictMode에서 effect가 두 번 돌아도 복귀 결과를 한 번만 복호화함. */
  const hasHandledReturnRef = useRef(false);

  async function applyResult(result: KmcResult) {
    setState({ status: "verifying" });
    const [error, response] = await tryit(decryptCertResult)(result);
    setState(error ? { status: "failed" } : toPhoneVerificationState(response));
  }

  useKmcPopupResult((result) => void applyResult(result));

  // 모바일 복귀: 주소의 결과 쿼리를 지우고(새로고침해도 다시 쓰지 않게) 보관한 입력을 되살린 뒤 복호화함.
  // 화면에 들어올 때 한 번만 처리함.
  const handleReturnFromKmc = useEffectEvent(() => {
    const recCert = searchParams.get(KMC_RESULT_PARAMS.recCert);
    const certNum = searchParams.get(KMC_RESULT_PARAMS.certNum);
    if (recCert === null || certNum === null || hasHandledReturnRef.current) {
      return;
    }
    hasHandledReturnRef.current = true;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(KMC_RESULT_PARAMS.recCert);
        next.delete(KMC_RESULT_PARAMS.certNum);
        return next;
      },
      { replace: true },
    );
    const draft = takeProfileDraft();
    if (draft) onRestoreDraft(draft);
    void applyResult({ recCert, certNum });
  });

  useEffect(() => {
    handleReturnFromKmc();
  }, []);

  async function startVerification(draft: ProfileDraft) {
    const [error, token] = await tryit(fetchCertToken)();
    if (error) {
      setState({ status: "failed" });
      return;
    }
    if (isTouch) {
      saveProfileDraft(draft);
      redirectToKmc(token, location.pathname + location.search);
      return;
    }
    setState(
      openKmcPopup(token) ? { status: "idle" } : { status: "popupBlocked" },
    );
  }

  function resetVerification() {
    setState({ status: "idle" });
  }

  return { state, startVerification, resetVerification };
}
