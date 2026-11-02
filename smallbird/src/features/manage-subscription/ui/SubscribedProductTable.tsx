import { useState } from "react";

import { usePaymentMethodLabel } from "@/entities/subscription";
import { EmptyState } from "@/shared/components/empty-state";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib";
import { useDialogTarget } from "@/shared/lib/useDialogTarget";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

import { useCancelSubscription } from "../lib/use-cancel-subscription";
import { useSubscriptionFormat } from "../lib/use-subscription-format";
import { CancelCompletedDialog } from "./CancelCompletedDialog";
import { CancelSubscriptionButton } from "./CancelSubscriptionButton";
import { CancelSubscriptionDialog } from "./CancelSubscriptionDialog";
import { SubscribedProductCards } from "./SubscribedProductCards";

import type { Subscription } from "@/entities/subscription";

const TABLET_QUERY = "(min-width: 768px)";
const COLUMN_COUNT = 6;

interface SubscribedProductTableProps {
  subscriptions: Subscription[];
}

// Figma 구독 결제 상품(PC·TAB 표 7185:113898, MO 세로 표 7064:190017). 오탈자 "결재액"·"결제방법"은 "결제액"·"결제 방법"으로 통일(스펙 §3).
// "구독해지"는 확인 알럿 → 해지 API → 완료 알럿. 성공하면 구독 목록을 다시 읽어 "해지 예정"으로 바뀜.
export function SubscribedProductTable({
  subscriptions,
}: SubscribedProductTableProps) {
  const { t } = useTranslation("features/manage-subscription");
  const isTabletUp = useMediaQuery(TABLET_QUERY);
  const cancelDialog = useDialogTarget<Subscription>();
  const { cancel } = useCancelSubscription();
  const [isCompletedOpen, setIsCompletedOpen] = useState(false);
  const { formatMembershipDate, formatWon } = useSubscriptionFormat();
  const paymentMethodLabel = usePaymentMethodLabel();

  const emptyState = (
    <EmptyState type="no-list" title={t("empty.title")} className="py-10" />
  );

  return (
    <section
      className="flex flex-col gap-3 tablet:gap-4"
      aria-labelledby="subscribed-products-title"
    >
      <h2
        id="subscribed-products-title"
        className="text-base leading-none font-semibold text-foreground"
      >
        {t("title")}
      </h2>
      {isTabletUp ? (
        // 시안은 6열이 같은 폭이고 "구독해지"가 마지막 열의 왼쪽에 놓임.
        <Table
          headerTone="gray"
          size="xs"
          className="table-fixed"
          aria-label={t("title")}
        >
          <TableHeader>
            <TableRow>
              <TableHead>{t("column.name")}</TableHead>
              <TableHead>{t("column.startedAt")}</TableHead>
              <TableHead>{t("column.endsAt")}</TableHead>
              <TableHead>{t("column.amount")}</TableHead>
              <TableHead>{t("column.method")}</TableHead>
              <TableHead>
                <span className="sr-only">{t("column.action")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.length === 0 ? (
              <TableRow className="[--table-row-hover:transparent]">
                <TableCell
                  colSpan={COLUMN_COUNT}
                  className="h-auto p-0 whitespace-normal"
                >
                  {emptyState}
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell className="whitespace-normal">
                    {subscription.productName}
                  </TableCell>
                  <TableCell>
                    {formatMembershipDate(subscription.startedAt)}
                  </TableCell>
                  <TableCell>
                    {formatMembershipDate(subscription.endsAt)}
                  </TableCell>
                  <TableCell>{formatWon(subscription.amount)}</TableCell>
                  <TableCell className="whitespace-normal">
                    {paymentMethodLabel(
                      subscription.paymentMethod,
                      subscription.cardKind,
                    )}
                  </TableCell>
                  <TableCell>
                    <CancelSubscriptionButton
                      subscription={subscription}
                      onClick={cancelDialog.open}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      ) : subscriptions.length === 0 ? (
        emptyState
      ) : (
        <SubscribedProductCards
          subscriptions={subscriptions}
          onClickCancel={cancelDialog.open}
        />
      )}
      <CancelSubscriptionDialog
        open={cancelDialog.isOpen}
        subscription={cancelDialog.target}
        onCancel={cancelDialog.close}
        onConfirm={() => {
          const target = cancelDialog.target;
          cancelDialog.close();
          if (!target) return;
          void cancel(target).then((isCanceled) => {
            if (isCanceled) setIsCompletedOpen(true);
          });
        }}
      />
      <CancelCompletedDialog
        open={isCompletedOpen}
        onConfirm={() => setIsCompletedOpen(false)}
      />
    </section>
  );
}
