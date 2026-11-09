import { PenLine, Wand2 } from "lucide-react";

import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

import type { IntroMode } from "@/entities/campaign";

interface IntroModeCardsProps {
  value: IntroMode | null;
  onChangeValue: (mode: IntroMode) => void;
  disabled?: boolean;
}

// 작성 방식 선택 카드 2장(Figma Card / Toggle). 선택된 카드는 포커스 링. 방식을 바꿔도 입력값은 지우지 않음.
export function IntroModeCards({
  value,
  onChangeValue,
  disabled,
}: IntroModeCardsProps) {
  const { t } = useTranslation("features/register-campaign");
  const cards = [
    { mode: "AI", icon: Wand2, key: "ai" },
    { mode: "MANUAL", icon: PenLine, key: "manual" },
  ] as const;

  return (
    <div
      role="radiogroup"
      aria-label={t("intro.mode.label")}
      className="flex flex-col gap-3 tablet:flex-row"
    >
      {cards.map(({ mode, icon: Icon, key }) => {
        const isSelected = value === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChangeValue(mode)}
            className={cn(
              "flex cursor-pointer flex-col items-start gap-2 rounded-lg border bg-card p-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 tablet:flex-1 desktop:w-90 desktop:flex-none",
              isSelected && "border-primary ring-1 ring-primary",
            )}
          >
            <span className="flex items-center gap-2 text-base leading-5 font-semibold">
              <Icon aria-hidden className="size-4" />
              {t(`intro.mode.${key}.title`)}
            </span>
            <span className="text-sm leading-5 text-muted-foreground">
              {t(`intro.mode.${key}.description`)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
