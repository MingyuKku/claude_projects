import { PenLine, WandSparkles } from "lucide-react";
import { RadioGroup } from "radix-ui";

import { useTranslation } from "@/shared/i18n";

import type { IntroMode } from "../../../model/store";
import type { ReactNode } from "react";

interface IntroModeFieldProps {
  value: IntroMode;
  onChangeValue: (mode: IntroMode) => void;
  disabled?: boolean;
}

const MODE_OPTIONS: readonly {
  mode: IntroMode;
  key: "ai" | "manual";
  icon: ReactNode;
}[] = [
  {
    mode: "AI",
    key: "ai",
    icon: <WandSparkles aria-hidden className="size-4" />,
  },
  {
    mode: "MANUAL",
    key: "manual",
    icon: <PenLine aria-hidden className="size-4" />,
  },
];

// 시안이 선택 상태를 Focus 모양(파란 링)으로 그려서 고른 카드에 링을 둠.
export function IntroModeField({
  value,
  onChangeValue,
  disabled,
}: IntroModeFieldProps) {
  const { t } = useTranslation("features/register-campaign");

  return (
    <RadioGroup.Root
      aria-label={t("step.intro")}
      value={value}
      onValueChange={(next) => {
        const option = MODE_OPTIONS.find(({ mode }) => mode === next);
        if (option) onChangeValue(option.mode);
      }}
      disabled={disabled}
      className="grid ds-gap-4 tablet:grid-cols-2 desktop:max-w-184.75"
    >
      {MODE_OPTIONS.map(({ mode, key, icon }) => (
        <RadioGroup.Item
          key={mode}
          value={mode}
          className="flex min-w-0 cursor-pointer flex-col rounded-lg border bg-card text-left outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 enabled:hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:ring-2 data-[state=checked]:ring-primary data-[state=checked]:ring-offset-2"
        >
          <span className="flex items-center gap-1.5 ds-px-5 pt-4 pb-1.5 ds-text-base-7-semibold">
            {icon}
            {t(`intro.mode.${key}.title`)}
          </span>
          <span className="ds-px-5 ds-pb-5 ds-text-sm-5-normal ko:break-keep">
            {t(`intro.mode.${key}.description`)}
          </span>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
