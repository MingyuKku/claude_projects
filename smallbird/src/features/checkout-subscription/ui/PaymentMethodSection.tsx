import { PayCard } from "@/shared/components/cards";
import { SectionCard } from "@/shared/components/section-card";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { CardHeader, CardTitle } from "@/shared/ui/card";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";

import { INSTALLMENT_OPTIONS, LUMP_SUM } from "../model/installment";

import type { BillingCard } from "@/entities/subscription";

interface PaymentMethodSectionProps {
  /** 등록된 카드(기본 카드가 맨 앞). 아직 읽는 중이면 undefined. */
  cards: BillingCard[] | undefined;
  /** 카드를 읽지 못했을 때. 안내와 다시 시도를 보임. */
  isError: boolean;
  /** 선택된 카드(결제에 쓰는 카드). */
  selectedCardId: string | undefined;
  /** 선택된 카드가 아닌 타일을 눌렀을 때. */
  onSelectCard: (card: BillingCard) => void;
  /** 할부를 고를 수 있는 카드(결제에 쓰는 카드). 없으면 모든 할부 선택이 "일시불"로 잠김(월간·체크카드). */
  installmentCardId: string | undefined;
  /** 그 카드에서 고른 할부 개월 수(일시불은 0). */
  installmentMonths: number;
  onChangeInstallment: (months: number) => void;
  onRetry: () => void;
}

// 카드 안쪽 여백(Figma Card 헤더·본문 20px, MO 16px)
const CARD_SIDE_CLASS = "px-4 tablet:px-5";
// 링(box-shadow)이 0.2초에 걸쳐 나타나고 사라짐(플랜 카드 강조와 같은 길이, 스펙 §3). 시안에 모션 정의는 없음. 동작 줄이기 설정이면 바로 바뀜.
const TILE_RING_TRANSITION_CLASS_NAME =
  "transition-shadow duration-200 motion-reduce:transition-none";
// 선택하지 않은 카드에 마우스를 올리면 선택 링보다 옅은 primary 링을 보임(사용자 결정 2026-11-03). 선택·포커스 중인 타일은
// 자기 링이 있으므로 제외해 호버 링이 그 링을 덮어 옅어지지 않게 함. 터치에서 탭한 뒤 호버가 남지 않게 hover 가능한 기기에서만 적용함
// (Tailwind의 hover: 와 같은 조건). 클래스는 전체를 글자 그대로 써야 Tailwind가 찾으므로 접두사를 변수로 합치지 않음.
const TILE_HOVER_RING_CLASS_NAME = [
  "[@media(hover:hover)]:[&:not(:has([data-state=checked],:focus-visible)):hover]:ring-2",
  "[@media(hover:hover)]:[&:not(:has([data-state=checked],:focus-visible)):hover]:ring-primary/40",
  "[@media(hover:hover)]:[&:not(:has([data-state=checked],:focus-visible)):hover]:ring-offset-2",
].join(" ");

// Figma 결제 수단(11755:99613): "카드 결제"(필수) 라디오 하나 아래에 등록 카드 타일. 결제 수단이 카드뿐이라 라디오는 선택된 채 고정임.
// 카드 타일은 라디오 그룹이고, 선택된 타일은 포커스 링과 같은 강조 링을 가짐(시안).
export function PaymentMethodSection({
  cards,
  isError,
  selectedCardId,
  onSelectCard,
  installmentCardId,
  installmentMonths,
  onChangeInstallment,
  onRetry,
}: PaymentMethodSectionProps) {
  const { t } = useTranslation("features/checkout-subscription");
  const { t: tCommon } = useTranslation();

  return (
    <SectionCard
      title={t("method.title")}
      className="gap-3 tablet:gap-4"
      cardClassName="gap-0"
    >
      <CardHeader className={cn("py-4", CARD_SIDE_CLASS)}>
        <CardTitle className="flex items-center gap-2">
          <RadioGroup value="card" aria-label={t("method.title")}>
            <RadioGroupItem
              value="card"
              disabled
              aria-label={t("method.card")}
              // 시안(Radio Base 선택·Disabled): 테두리와 점이 muted-foreground, 전체 50%.
              className="text-muted-foreground data-[state=checked]:border-muted-foreground [&_svg]:fill-muted-foreground"
            />
          </RadioGroup>
          <span className="flex items-center gap-1">
            {t("method.card")}
            <Badge size="sm">{t("method.required")}</Badge>
          </span>
        </CardTitle>
      </CardHeader>
      <div className={cn("pb-4 tablet:pb-5", CARD_SIDE_CLASS)}>
        {isError ? (
          <div className="flex flex-col items-start gap-2 text-sm">
            <p className="text-destructive">{t("error.cardsLoadFailed")}</p>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              {tCommon("action.retry")}
            </Button>
          </div>
        ) : cards === undefined ? (
          <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 tablet:gap-5">
            <Skeleton className="h-33 w-full" />
            <Skeleton className="h-33 w-full" />
          </div>
        ) : (
          <RadioGroup
            value={selectedCardId}
            onValueChange={(cardId) => {
              const card = cards.find((item) => item.id === cardId);
              if (card) onSelectCard(card);
            }}
            aria-label={t("method.card")}
            className="grid grid-cols-1 gap-4 tablet:grid-cols-2 tablet:gap-5"
          >
            {cards.map((card) => (
              <div
                key={card.id}
                // 라디오는 타일 전체를 덮는 투명 버튼이라, 선택·키보드 포커스는 타일의 링으로 보임.
                className={cn(
                  "relative flex flex-col gap-3 rounded-lg border bg-background p-3 tablet:gap-4 tablet:p-4",
                  TILE_RING_TRANSITION_CLASS_NAME,
                  "has-focus-visible:ring-2 has-focus-visible:ring-primary has-focus-visible:ring-offset-2 has-data-[state=checked]:ring-2 has-data-[state=checked]:ring-primary has-data-[state=checked]:ring-offset-2",
                  TILE_HOVER_RING_CLASS_NAME,
                )}
              >
                <RadioGroupItem
                  value={card.id}
                  aria-label={`${card.issuer} ${card.maskedNumber}`}
                  className="absolute inset-0 aspect-auto size-full rounded-lg border-0 opacity-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <PayCard
                  name={card.issuer}
                  number={card.maskedNumber}
                  className="pointer-events-none w-full hover:opacity-100"
                  badge={
                    card.isDefault ? (
                      <Badge size="sm">{t("method.defaultCard")}</Badge>
                    ) : undefined
                  }
                />
                <Select
                  value={String(
                    card.id === installmentCardId
                      ? installmentMonths
                      : LUMP_SUM,
                  )}
                  onValueChange={(months) =>
                    onChangeInstallment(Number(months))
                  }
                  disabled={card.id !== installmentCardId}
                >
                  <SelectTrigger
                    // 라디오 버튼 위에 놓여 눌러도 카드가 선택되지 않음. 비활성은 시안처럼 50%.
                    className="relative disabled:opacity-50"
                    aria-label={t("installment.label", {
                      card: `${card.issuer} ${card.maskedNumber}`,
                    })}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTALLMENT_OPTIONS.map((months) => (
                      <SelectItem key={months} value={String(months)}>
                        {months === LUMP_SUM
                          ? t("installment.lumpSum")
                          : t("installment.months", { months })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </RadioGroup>
        )}
      </div>
    </SectionCard>
  );
}
