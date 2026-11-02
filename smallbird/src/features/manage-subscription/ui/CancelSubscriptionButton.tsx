import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import type { Subscription } from "@/entities/subscription";

interface CancelSubscriptionButtonProps {
  subscription: Subscription;
  onClick: (subscription: Subscription) => void;
}

// Figma "구독해지"(destructive outline). 해지 예정이면 종료일까지 비활성 "해지 예정"(스펙 §3).
export function CancelSubscriptionButton({
  subscription,
  onClick,
}: CancelSubscriptionButtonProps) {
  const { t } = useTranslation("features/manage-subscription");

  return (
    <Button
      variant="outline"
      destructive
      size="sm"
      disabled={subscription.isCancelScheduled}
      onClick={() => onClick(subscription)}
    >
      {subscription.isCancelScheduled
        ? t("action.cancelScheduled")
        : t("action.cancel")}
    </Button>
  );
}
