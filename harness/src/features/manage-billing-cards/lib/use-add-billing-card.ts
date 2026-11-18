import { useState } from "react";
import { toast } from "sonner";

import {
  requestCardIssuance,
  submitIssuanceForm,
} from "@/entities/subscription";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { useOnPageRestore } from "@/shared/lib";

import { rememberReturnParams } from "./return-params";

import type { ReturnParams } from "./return-params";

/**
 * 카드 추가. 결제 서버에서 결제창 값을 받아 이니시스 카드 등록 페이지로 이동함(결제 없이 카드만 저장).
 * 이동에 성공하면 이 화면은 떠나므로 `isAdding`은 실패했을 때만 false로 돌아옴. 결과는 `BillingCardResultHandler`가 받음.
 * `returnParams`를 넘기면 등록하고 돌아와서 그 쿼리의 화면을 엶(예: 구독하려던 결제 화면).
 */
export function useAddBillingCard() {
  const { t } = useTranslation("features/manage-billing-cards");
  const [isAdding, setIsAdding] = useState(false);
  // 이니시스 페이지에서 뒤로 가기로 돌아오면 복원된 화면의 "진행 중"이 남아 버튼이 계속 막히므로 되돌림.
  useOnPageRestore(() => setIsAdding(false));

  async function add(returnParams?: ReturnParams) {
    setIsAdding(true);
    rememberReturnParams(returnParams);
    try {
      const form = await requestCardIssuance({
        redirectUri: ROUTES.mypageSubscribe,
      });
      submitIssuanceForm(form);
    } catch {
      rememberReturnParams(undefined);
      toast.error(t("card.registerResult.failure"));
      setIsAdding(false);
    }
  }

  return { add, isAdding };
}
