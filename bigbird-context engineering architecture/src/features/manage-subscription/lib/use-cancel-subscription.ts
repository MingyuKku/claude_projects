import { toast } from "sonner";

import {
  cancelSubscription,
  readApiErrorReason,
  useSubscriptions,
} from "@/entities/subscription";
import { useTranslation } from "@/shared/i18n";

import type { Subscription } from "@/entities/subscription";

/** 구독 해지. 성공하면 구독 목록을 다시 읽어 "해지 예정"으로 바꾸고, 실패하면 이유를 토스트로 알림. */
export function useCancelSubscription() {
  const { t } = useTranslation("features/manage-subscription");
  const { t: tCommon } = useTranslation();
  const { mutate } = useSubscriptions();

  /** 해지가 끝났으면 true. */
  async function cancel(subscription: Subscription) {
    try {
      await cancelSubscription(subscription.id);
      await mutate();
      return true;
    } catch (error) {
      const reason = readApiErrorReason(error);
      if (reason === "ALREADY_CANCELED") {
        toast.error(t("error.alreadyCanceled"));
        void mutate();
      } else if (reason === "SUBSCRIPTION_NOT_FOUND") {
        toast.error(t("error.notFound"));
        void mutate();
      } else {
        toast.error(tCommon("error.unexpected"));
      }
      return false;
    }
  }

  return { cancel };
}
