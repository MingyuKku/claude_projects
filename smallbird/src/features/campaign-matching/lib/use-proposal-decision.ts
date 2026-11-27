import { tryit } from "radash";
import { useState } from "react";
import { toast } from "sonner";

import {
  acceptProposal,
  counterProposal,
  rejectProposal,
} from "@/entities/campaign-progress";
import { isApiError } from "@/shared/api";
import { useTranslation } from "@/shared/i18n";

export type DecisionDialog = "accept" | "reject" | "payNow";

/** 이미 처리됐거나, 응답할 차례가 아니거나, 캠페인 기간이 끝나 서버가 막음. */
const CONFLICT_STATUS = 409;

/** 수락·거절·다시 제안 요청과 확인 창 상태. 끝나면 `onDone`으로 대화·목록을 다시 읽음. */
export function useProposalDecision(proposalIdx: number, onDone: () => void) {
  const { t } = useTranslation("features/campaign-matching");
  const { t: tCommon } = useTranslation();
  const [dialog, setDialog] = useState<DecisionDialog | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function run(request: () => Promise<void>) {
    setIsBusy(true);
    const [error] = await tryit(request)();
    setIsBusy(false);
    if (error) {
      const isConflict = isApiError(error) && error.status === CONFLICT_STATUS;
      toast.error(
        isConflict ? t("decision.conflict") : tCommon("error.unexpected"),
      );
      setDialog(null);
      if (isConflict) onDone();
      return false;
    }
    onDone();
    return true;
  }

  return {
    dialog,
    isBusy,
    open: setDialog,
    close: () => setDialog(null),
    accept: async () => {
      if (await run(() => acceptProposal(proposalIdx))) setDialog("payNow");
    },
    reject: async () => {
      if (await run(() => rejectProposal(proposalIdx))) setDialog(null);
    },
    counter: (amount: number) =>
      run(() => counterProposal(proposalIdx, amount)),
  };
}
