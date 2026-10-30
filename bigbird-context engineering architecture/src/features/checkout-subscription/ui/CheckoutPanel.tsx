import { CreditCard } from "lucide-react";
import { useId, useState } from "react";

import { useBillingCards, useProductTypeLabel } from "@/entities/subscription";
import { SectionCard } from "@/shared/components/section-card";
import { formatNumber, useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";

import { useStartSubscription } from "../model/use-start-subscription";

import type {
  ActiveProductType,
  BillingPeriod,
  SubscriptionPlanCatalog,
} from "@/entities/subscription";
import type { ReactNode } from "react";

interface CheckoutPanelProps {
  catalog: SubscriptionPlanCatalog;
  type: ActiveProductType;
  /** 구독 탭에서 고른 결제 주기. 월 단위 문구를 연 단위로 바꿈. */
  period: BillingPeriod;
  /** "취소". 상품 선택(구독 탭)으로 돌아감. */
  onCancel: () => void;
}

interface RowProps {
  label: string;
  value: ReactNode;
  /** value: 값만 굵게(이용 요금), total: 라벨·값 모두 크고 굵게(결제 금액) */
  emphasis?: "value" | "total";
}

// Figma Table Base / Cell: 높이 48px, 라벨·값 칸이 반반(flex-1)에 좌우 16px, 구분선 없음. 값이 길면 줄바꿈되어 행이 커짐.
function Row({ label, value, emphasis }: RowProps) {
  const isTotal = emphasis === "total";

  return (
    <div
      className={cn(
        "flex min-h-12 items-center text-sm leading-5",
        isTotal && "text-base leading-6 font-semibold",
      )}
    >
      <dt className="flex-1 px-4 font-semibold">{label}</dt>
      <dd
        className={cn(
          "flex-1 px-4 text-right ko:break-keep",
          emphasis && "font-semibold",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

// 카드 안쪽 여백(Figma Card 헤더·본문 20px, MO 16px)
const CARD_SIDE_CLASS = "px-4 tablet:px-5";

// 구독하기 → 결제 화면. PC 2단(오른쪽 결제 요약 496px), TAB·MO 1단(결제 요약이 아래).
export function CheckoutPanel({
  catalog,
  type,
  period,
  onCancel,
}: CheckoutPanelProps) {
  const { t } = useTranslation("features/checkout-subscription");
  const { t: tCommon } = useTranslation();
  const productLabel = useProductTypeLabel()(type);
  // 기본 카드가 있으면 결제창 없이 그 카드로 바로 결제하므로, 카드를 읽기 전에는 결제 방식을 정할 수 없음.
  // 읽기에 실패하면 기본 카드가 있는지 알 수 없어 새 카드 결제로 넘기지 않고(카드 중복 등록 위험) 안내와 다시 시도를 둠.
  const {
    data: cards,
    isError: isCardsError,
    mutate: reloadCards,
  } = useBillingCards();
  const defaultCard = cards?.find((card) => card.isDefault);
  const { start, isStarting } = useStartSubscription(Boolean(defaultCard));
  const [isAgreed, setIsAgreed] = useState(false);
  const agreeId = useId();
  // 결제 화면에는 월간/연간 구분이 없어 월 요금을 씀.
  const plan = catalog.plans.find((item) => item.type === type);
  // 연간은 서버가 준 연간 결제 총액을 한 번에 결제함(스펙 §3 결제 흐름).
  const price =
    period === "yearly" ? (plan?.yearlyPrice ?? 0) : (plan?.monthlyPrice ?? 0);
  const amount = formatNumber(price);

  function handlePay() {
    void start(type, period);
  }

  return (
    <>
      <div className="grid grid-cols-1 items-start gap-4 tablet:gap-5 desktop:grid-cols-[minmax(0,1fr)_29.75rem]">
        <div className="flex flex-col gap-4 tablet:gap-6">
          <SectionCard
            title={t("product.title")}
            className="gap-3 tablet:gap-4"
            cardClassName="gap-0"
          >
            <CardHeader className={cn("py-4", CARD_SIDE_CLASS)}>
              <CardTitle>{productLabel}</CardTitle>
            </CardHeader>
            <dl className={cn("pb-4 tablet:pb-5", CARD_SIDE_CLASS)}>
              <Row label={t("product.serviceType")} value={productLabel} />
              <Row
                label={t("product.fee")}
                value={t(`price.fee.${period}`, { amount })}
                emphasis="value"
              />
              <Row
                label={t("product.start")}
                value={t(`product.startValue.${period}`)}
              />
            </dl>
          </SectionCard>
          <SectionCard
            title={t("notice.title")}
            className="gap-3 tablet:gap-4"
            cardClassName="gap-0"
          >
            <div className={cn("flex items-start gap-2 py-4", CARD_SIDE_CLASS)}>
              <Checkbox
                id={agreeId}
                checked={isAgreed}
                onCheckedChange={(checked) => setIsAgreed(checked === true)}
              />
              <Label
                htmlFor={agreeId}
                className="text-sm leading-5 font-semibold"
              >
                {t("notice.agree")}
              </Label>
            </div>
            <ul
              className={cn(
                "flex flex-col gap-2 pb-4 pl-8 text-sm leading-none tablet:pb-5 tablet:pl-11",
                "pr-4 tablet:pr-5",
              )}
            >
              <li>{t("notice.items.1")}</li>
              <li>{t(`notice.renewal.${period}`)}</li>
            </ul>
          </SectionCard>
        </div>
        <Card>
          <CardHeader className={cn("py-4", CARD_SIDE_CLASS)}>
            <CardTitle role="heading" aria-level={2}>
              {t("summary.title")}
            </CardTitle>
          </CardHeader>
          <dl className={cn("pb-3", CARD_SIDE_CLASS)}>
            <Row label={t("summary.product")} value={productLabel} />
            {defaultCard && (
              <Row
                label={t("summary.card")}
                value={`${defaultCard.issuer} ${defaultCard.maskedNumber}`}
              />
            )}
            {isCardsError && (
              <Row
                label={t("summary.card")}
                value={
                  <span className="flex flex-col items-end gap-2">
                    <span className="text-destructive">
                      {t("error.cardsLoadFailed")}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void reloadCards()}
                    >
                      {tCommon("action.retry")}
                    </Button>
                  </span>
                }
              />
            )}
            <Row
              label={t("summary.amount")}
              value={t("price.won", { amount })}
              emphasis="total"
            />
          </dl>
          <div className="flex flex-col gap-2 p-4 tablet:p-5">
            <Button
              type="button"
              className="w-full"
              disabled={!isAgreed || isStarting || !cards}
              onClick={handlePay}
            >
              <CreditCard aria-hidden />
              {t("summary.pay")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onCancel}
            >
              {t("summary.cancel")}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
