import {
  usePaymentMethodLabel,
  useSubscriptionProductName,
} from "@/entities/subscription";
import { useTranslation } from "@/shared/i18n";
import { orEmptyValue } from "@/shared/lib";

import { useSubscriptionFormat } from "../lib/use-subscription-format";
import { CancelSubscriptionButton } from "./CancelSubscriptionButton";

import type { Subscription } from "@/entities/subscription";

interface SubscribedProductCardsProps {
  subscriptions: Subscription[];
  onClickCancel: (subscription: Subscription) => void;
}

export function SubscribedProductCards({
  subscriptions,
  onClickCancel,
}: SubscribedProductCardsProps) {
  const { t } = useTranslation("features/manage-subscription");
  const { formatMembershipDate, formatWon } = useSubscriptionFormat();
  const paymentMethodLabel = usePaymentMethodLabel();
  const productName = useSubscriptionProductName();

  return (
    <ul aria-label={t("title")} className="flex flex-col gap-5">
      {subscriptions.map((subscription) => {
        const rows = [
          {
            key: "startedAt",
            value: orEmptyValue(formatMembershipDate(subscription.startedAt)),
          },
          {
            key: "endsAt",
            value: orEmptyValue(formatMembershipDate(subscription.endsAt)),
          },
          { key: "amount", value: formatWon(subscription.amount) },
          {
            key: "method",
            value: orEmptyValue(
              paymentMethodLabel(
                subscription.paymentMethod,
                subscription.cardKind,
              ),
            ),
          },
        ] as const;

        return (
          <li key={subscription.id}>
            <dl className="grid grid-cols-[minmax(6.25rem,7rem)_minmax(0,1fr)] overflow-hidden rounded-lg border">
              <dt className="flex min-h-12 items-center border-b bg-muted/40 px-4 text-sm leading-6 font-medium text-muted-foreground">
                {t("column.name")}
              </dt>
              <dd className="flex min-h-12 min-w-0 items-center justify-between gap-2 border-b px-4 py-2 text-sm leading-5 text-foreground">
                <span className="min-w-0 break-all">
                  {orEmptyValue(
                    productName(
                      subscription.type,
                      subscription.billingPeriod,
                      subscription.productName,
                    ),
                  )}
                </span>
                <CancelSubscriptionButton
                  subscription={subscription}
                  onClick={onClickCancel}
                />
              </dd>
              {rows.map(({ key, value }) => (
                <div key={key} className="contents">
                  <dt className="flex min-h-12 items-center border-b bg-muted/40 px-4 text-sm leading-6 font-medium text-muted-foreground [div:last-child>&]:border-b-0">
                    {t(`column.${key}`)}
                  </dt>
                  <dd className="flex min-h-12 min-w-0 items-center border-b px-4 py-2 text-sm leading-5 text-foreground [div:last-child>&]:border-b-0">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
