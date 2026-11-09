import { useState } from "react";
import { toast } from "sonner";

import { useTranslation } from "@/shared/i18n";

import { useRequestCharge } from "../api/use-request-charge";
import { getAmountError, isChargeable } from "../lib/amount";

/**
 * 충전 금액 입력 상태와 "충전하기 → 약관 동의 → 결제 요청" 흐름. 마이페이지 패널과 결제 화면의 인라인 충전이 함께 씀.
 * `returnPath`를 넘기면 결제 뒤 그 화면으로 돌아옴(기본은 마이페이지 빅버드 머니).
 */
export function useChargeForm(returnPath?: string) {
  const { t: tCommon } = useTranslation();
  const { isRequesting, request } = useRequestCharge();
  const [amount, setAmount] = useState<number | null>(null);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const error = getAmountError(amount);
  const canCharge = isChargeable(amount) && !isRequesting;

  // 충전하기는 약관 팝업을 열고, 팝업에서 동의해야 결제창으로 넘어감(v2의 필수 동의).
  function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    if (!isChargeable(amount) || isRequesting) return;
    setIsTermsOpen(true);
  }

  async function handleAgree() {
    if (!isChargeable(amount) || isRequesting) return;
    setIsTermsOpen(false);
    const isStarted = await request(amount, returnPath);
    if (isStarted === false) toast.error(tCommon("error.unexpected"));
  }

  return {
    amount,
    setAmount,
    error,
    canCharge,
    isRequesting,
    isTermsOpen,
    closeTerms: () => setIsTermsOpen(false),
    handleSubmit,
    handleAgree,
  };
}

export type ChargeForm = ReturnType<typeof useChargeForm>;
