import { toast } from "sonner";

import {
  deleteBillingCard,
  readApiErrorReason,
  useBillingCards,
  useSetDefaultBillingCard,
} from "@/entities/subscription";
import { useTranslation } from "@/shared/i18n";

import type { BillingCard } from "@/entities/subscription";

/**
 * 카드 삭제·결제 카드로 등록. 목록은 낙관적으로 먼저 바꾸고, 실패하면 되돌린 뒤 이유를 토스트로 알림.
 * 성공하면 서버 값으로 다시 읽음(삭제로 남은 카드가 기본 카드가 되는 경우 등).
 */
export function useBillingCardActions() {
  const { t } = useTranslation("features/manage-billing-cards");
  const { t: tCommon } = useTranslation();
  const { data: cards, mutate } = useBillingCards();
  const setDefault = useSetDefaultBillingCard();

  function notifyFailure(error: unknown) {
    const reason = readApiErrorReason(error);
    if (reason === "DEFAULT_CARD_IN_USE") {
      toast.error(t("error.defaultCardInUse"));
    } else if (reason === "BILLING_CARD_NOT_FOUND") {
      toast.error(t("error.notFound"));
      void mutate();
    } else {
      toast.error(tCommon("error.unexpected"));
    }
  }

  async function removeCard(card: BillingCard) {
    try {
      await mutate(() => deleteBillingCard(card.id).then(() => undefined), {
        optimisticData: cards?.filter((item) => item.id !== card.id),
        rollbackOnError: true,
        populateCache: false,
        revalidate: true,
      });
      toast(t("delete.completed"));
      return true;
    } catch (error) {
      notifyFailure(error);
      return false;
    }
  }

  async function makeDefault(card: BillingCard) {
    try {
      await setDefault(card.id);
      return true;
    } catch (error) {
      notifyFailure(error);
      return false;
    }
  }

  return { removeCard, makeDefault };
}
