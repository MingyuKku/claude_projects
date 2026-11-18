import { useState } from "react";
import { toast } from "sonner";

import {
  readApiErrorReason,
  useBillingCards,
  useSetDefaultBillingCard,
} from "@/entities/subscription";
import { useTranslation } from "@/shared/i18n";

import type { BillingCard } from "@/entities/subscription";

/**
 * 결제 화면에서 다른 카드를 고르면 기본 카드로 바꿀지 묻고, 확인하면 기본 카드를 바꿈(기본 카드로만 결제함).
 * 묻는 동안 고른 카드가 선택된 것으로 보이고(`pendingCard`), 취소하면 기본 카드로 돌아감.
 * 바꾸는 동안에는 알럿을 닫지 않고, 끝나면(실패해도) 닫음. 실패하면 목록은 되돌아가고 이유를 토스트로 알림.
 */
export function useChangeDefaultCard() {
  const { t } = useTranslation("features/checkout-subscription");
  const { t: tCommon } = useTranslation();
  const { mutate } = useBillingCards();
  const setDefault = useSetDefaultBillingCard();
  const [pendingCard, setPendingCard] = useState<BillingCard | null>(null);
  const [isChanging, setIsChanging] = useState(false);

  function cancel() {
    if (!isChanging) setPendingCard(null);
  }

  async function confirm() {
    if (!pendingCard) return;
    setIsChanging(true);
    try {
      await setDefault(pendingCard.id);
    } catch (error) {
      if (readApiErrorReason(error) === "BILLING_CARD_NOT_FOUND") {
        toast.error(t("error.cardNotFound"));
        void mutate();
      } else {
        toast.error(tCommon("error.unexpected"));
      }
    } finally {
      setIsChanging(false);
      setPendingCard(null);
    }
  }

  return {
    pendingCard,
    isChanging,
    selectCard: setPendingCard,
    cancel,
    confirm,
  };
}
