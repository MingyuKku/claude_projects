import { PlanCard } from "@/shared/components/cards";
import { Inform } from "@/shared/components/inform";
import { Stepper } from "@/shared/components/stepper";
import { formatNumber, useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";

import { isActiveProductType } from "../model/codes";

import type {
  ActiveProductType,
  BillingPeriod,
  SubscriptionProductType,
} from "../model/codes";
import type { PlanCardType } from "@/shared/components/cards";

// 연간 카드의 할인 전 금액(줄 긋기)은 월 요금 × 12로 계산함(스펙 §3, 서버가 따로 주지 않음).
const MONTHS_PER_YEAR = 12;

const ITEM_IDS = ["1", "2", "3"] as const;
const STEP_IDS = ["1", "2", "3", "4", "5"] as const;

interface SubscriptionPlanCardProps {
  type: SubscriptionProductType;
  /** 선택한 결제 주기. 월간이면 "월 ○원", 연간이면 할인 전 "연 ○원"(줄 긋기)과 결제 총액 "연 ○원"으로 보임. */
  period: BillingPeriod;
  /** 월 요금(원). */
  monthlyPrice: number;
  /** 연간 결제 총액(원, 할인 반영). */
  yearlyPrice: number;
  isAvailable: boolean;
  /** 구독 중(해지 예정 포함). */
  isSubscribed: boolean;
  isExpanded: boolean;
  className?: string;
  onToggleDetail: () => void;
  onSubscribe: (type: ActiveProductType) => void;
}

// 구독 탭의 상품 카드. 카드 자체는 클릭 동작이 없고, 강조 링(Focused)은 키보드 포커스·호버·상세보기 펼침에 씀(스펙 §3).
export function SubscriptionPlanCard({
  type,
  period,
  monthlyPrice,
  yearlyPrice,
  isAvailable,
  isSubscribed,
  isExpanded,
  className,
  onToggleDetail,
  onSubscribe,
}: SubscriptionPlanCardProps) {
  const { t } = useTranslation("entities/subscription");
  const activeType = isActiveProductType(type) ? type : null;
  const cardType: PlanCardType =
    activeType === null || !isAvailable
      ? "disabled"
      : isSubscribed
        ? "subscribed"
        : "default";

  const focusClassName = cn(
    // 클릭 동작이 없는 카드라 포인터 커서와 호버 배경 대신 Focused 링을 씀.
    // 링은 box-shadow라 그 속성만 전환함(동작 줄이기 설정이면 바로 바뀜).
    "transition-[background-color,box-shadow] duration-200 motion-reduce:transition-none",
    "cursor-default hover:bg-card hover:ring-2 hover:ring-primary hover:ring-offset-2 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
    isExpanded && "ring-2 ring-primary ring-offset-2",
  );

  if (activeType === null || !isAvailable) {
    return (
      <PlanCard
        type={cardType}
        className={className}
        title={t(`productType.${type}`)}
        price={t("plan.comingSoonPrice")}
        badges={<Badge variant="gray">{t("plan.badge.undecided")}</Badge>}
        comingSoonText={
          <>
            <span>{t("plan.comingSoonText.line1")}</span>
            <span>{t("plan.comingSoonText.line2")}</span>
          </>
        }
        actionLabel={t("plan.comingSoon")}
      />
    );
  }

  const price = period === "yearly" ? yearlyPrice : monthlyPrice;
  const originalPrice = monthlyPrice * MONTHS_PER_YEAR;
  // 할인이 없으면 줄 그은 금액이 결제 금액과 같아 의미가 없음.
  const hasYearlyDiscount = period === "yearly" && originalPrice > yearlyPrice;

  return (
    <PlanCard
      type={cardType}
      className={cn(className, focusClassName)}
      title={t(`productType.${activeType}`)}
      price={t(`plan.price.${period}`, { price: formatNumber(price) })}
      originalPrice={
        hasYearlyDiscount
          ? t("plan.price.yearly", { price: formatNumber(originalPrice) })
          : undefined
      }
      badges={
        <>
          <Badge variant="blue">{t("plan.badge.brand")}</Badge>
          <Badge variant="green">{t("plan.badge.groupBuy")}</Badge>
        </>
      }
      features={ITEM_IDS.map((id) => ({
        id,
        text: t(`plan.${activeType}.features.${id}`),
      }))}
      isExpanded={isExpanded}
      detail={<PlanDetail type={activeType} />}
      detailLabel={t("plan.detail")}
      onClickDetail={onToggleDetail}
      actionLabel={isSubscribed ? t("plan.subscribed") : t("plan.subscribe")}
      onClickAction={() => onSubscribe(activeType)}
    />
  );
}

// 펼친 카드의 상세: 소개·이용 방식(Stepper 5단계)·브랜드형 설명·공구형 설명.
function PlanDetail({ type }: { type: ActiveProductType }) {
  const { t } = useTranslation("entities/subscription");

  return (
    <>
      <Inform
        size="sm"
        title={t(`plan.${type}.intro.title`)}
        items={ITEM_IDS.map((id) => ({
          id,
          text: t(`plan.${type}.intro.items.${id}`),
        }))}
      />
      <div className="flex flex-col gap-3">
        <p className="text-sm leading-none font-semibold">
          {t("plan.stepsTitle")}
        </p>
        <Stepper
          steps={STEP_IDS.map((id) => ({
            id,
            label: t(`plan.${type}.steps.${id}`),
          }))}
        />
      </div>
      <Inform
        size="sm"
        title={t("plan.brand.title")}
        items={ITEM_IDS.map((id) => ({
          id,
          text: t(`plan.brand.items.${id}`),
        }))}
      />
      <Inform
        size="sm"
        title={t("plan.groupBuy.title")}
        items={ITEM_IDS.map((id) => ({
          id,
          text: t(`plan.groupBuy.items.${id}`),
        }))}
      />
    </>
  );
}
