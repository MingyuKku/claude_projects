import { useState } from "react";

import { useBillingCards, useSubscriptions } from "@/entities/subscription";
import { PayCard, PayCardAddButton } from "@/shared/components/cards";
import { EmptyState } from "@/shared/components/empty-state";
import { useTranslation } from "@/shared/i18n";
import { useDialogTarget } from "@/shared/lib/useDialogTarget";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { canDeleteCard } from "../lib/can-delete-card";
import { useAddBillingCard } from "../lib/use-add-billing-card";
import { useBillingCardActions } from "../lib/use-billing-card-actions";
import { BillingCardMenu } from "./BillingCardMenu";
import { CardChangedDialog } from "./CardChangedDialog";
import { ChangeDefaultCardDialog } from "./ChangeDefaultCardDialog";
import { DeleteCardDialog } from "./DeleteCardDialog";

import type { BillingCard } from "@/entities/subscription";

/** 정기결제 카드는 최대 2장(디자이너 주석). 2장이면 "카드 추가" 칸이 사라짐. */
const MAX_CARD_COUNT = 2;
/** MO는 칸 폭을 채우고 높이는 TAB·PC 카드(186×100) 비율을 따름. */
const CARD_SIZE_CLASS =
  "w-full max-tablet:aspect-186/100 max-tablet:h-auto tablet:w-46.5";

// Figma 정기결제 카드(7185:113898 카드 1장, 7185:123698 카드 2장, 0장 7185:120263). 섹션명은 "정기결제 카드"로 통일(시안 오기 "정기결제 방법").
// 목록·삭제·결제 카드로 등록은 API 연동(낙관적 갱신). 카드 추가는 결제 서버가 준 값으로 이니시스 카드 등록 페이지로 이동함(결과는 BillingCardResultHandler).
export function BillingCardList() {
  const { t } = useTranslation("features/manage-billing-cards");
  const { t: tCommon } = useTranslation();
  const { data: cards, isLoading, isError, mutate } = useBillingCards();
  // 구독 결제 상품 표가 이미 읽는 같은 키라 추가 요청은 없음. 기본 카드 삭제를 보여 줄지 가리는 데 씀.
  const { data: subscriptions, isLoading: isSubscriptionsLoading } =
    useSubscriptions();
  const { removeCard, makeDefault } = useBillingCardActions();
  const { add: addCard, isAdding } = useAddBillingCard();
  const deleteDialog = useDialogTarget<BillingCard>();
  const changeDialog = useDialogTarget<BillingCard>();
  const [isChangedOpen, setIsChangedOpen] = useState(false);

  return (
    <section
      className="flex flex-col gap-3 tablet:gap-4"
      aria-labelledby="billing-cards-title"
    >
      <h2
        id="billing-cards-title"
        className="text-base leading-none font-semibold text-foreground"
      >
        {t("title")}
      </h2>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 tablet:flex tablet:gap-5">
          <Skeleton className="h-28 w-full tablet:w-46.5" />
          <Skeleton className="h-28 w-full tablet:w-46.5" />
        </div>
      ) : isError || !cards ? (
        <EmptyState
          type="alarm"
          title={tCommon("error.unexpected")}
          className="py-10"
          action={
            <Button variant="outline" onClick={() => void mutate()}>
              {tCommon("action.retry")}
            </Button>
          }
        />
      ) : (
        /* MO는 카드 156px 2열이고 높이는 186:100 비율로 줄어 83.9px(시안), TAB·PC는 186×100. */
        <ul className="grid grid-cols-2 gap-4 tablet:flex tablet:flex-wrap tablet:gap-5">
          {cards.map((card) => (
            <li key={card.id} className="contents">
              <PayCard
                name={card.issuer}
                number={card.maskedNumber}
                className={cn(
                  CARD_SIZE_CLASS,
                  card.isDefault && "ring-2 ring-primary ring-offset-2",
                )}
                badge={
                  card.isDefault ? (
                    <Badge size="sm">{t("card.default")}</Badge>
                  ) : undefined
                }
                menu={
                  canDeleteCard(card, {
                    cards,
                    subscriptions,
                    isSubscriptionsLoading,
                  }) ? (
                    <BillingCardMenu
                      card={card}
                      onSelectDelete={deleteDialog.open}
                      onSelectChange={changeDialog.open}
                    />
                  ) : undefined
                }
              />
            </li>
          ))}
          {cards.length < MAX_CARD_COUNT && (
            <li className="contents">
              <PayCardAddButton
                label={t("card.add")}
                className={CARD_SIZE_CLASS}
                onClick={() => void addCard()}
                disabled={isAdding}
              />
            </li>
          )}
        </ul>
      )}
      <DeleteCardDialog
        open={deleteDialog.isOpen}
        card={deleteDialog.target}
        onCancel={deleteDialog.close}
        onConfirm={() => {
          const target = deleteDialog.target;
          deleteDialog.close();
          if (target) void removeCard(target);
        }}
      />
      <ChangeDefaultCardDialog
        open={changeDialog.isOpen}
        onCancel={changeDialog.close}
        onConfirm={() => {
          const target = changeDialog.target;
          changeDialog.close();
          if (!target) return;
          void makeDefault(target).then((isChanged) => {
            if (isChanged) setIsChangedOpen(true);
          });
        }}
      />
      <CardChangedDialog
        open={isChangedOpen}
        onConfirm={() => setIsChangedOpen(false)}
      />
    </section>
  );
}
