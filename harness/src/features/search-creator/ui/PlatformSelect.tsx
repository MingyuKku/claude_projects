import { CREATOR_PLATFORMS, isCreatorPlatform } from "@/entities/platform";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { useTranslation } from "@/shared/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import type { CreatorPlatform } from "@/entities/platform";

interface PlatformSelectProps {
  value: CreatorPlatform;
  onChange: (platform: CreatorPlatform) => void;
}

// 입력창 안의 작은 칩 모양 트리거: 공용 SelectTrigger의 폭·글자색·간격만 시안(Text Field 플랫폼 셀렉트)에 맞춤.
// 선택 항목의 ✓는 공용 SelectItem이 오른쪽 끝(padding 8px)에 두므로 여기서 여백·위치를 다시 주지 않음. 색만 시안대로 primary.
// 선택 해제는 지원하지 않으므로 항상 하나가 선택되어 있음.
const TRIGGER_CLASS_NAME =
  "w-auto justify-start gap-1 pr-2 pl-3 font-medium text-primary *:data-[slot=select-value]:gap-1 [&_[data-slot=select-value]_img]:size-4";
const ITEM_CLASS_NAME = "gap-1.5 [&_svg:not([class*='text-'])]:text-primary";

export function PlatformSelect({ value, onChange }: PlatformSelectProps) {
  const { t } = useTranslation("features/search-creator");

  function handleChangeValue(next: string) {
    if (isCreatorPlatform(next)) onChange(next);
  }

  return (
    <Select value={value} onValueChange={handleChangeValue}>
      <SelectTrigger
        size="sm"
        aria-label={t("platform.label")}
        className={TRIGGER_CLASS_NAME}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start" className="max-h-56 w-50">
        {CREATOR_PLATFORMS.map((platform) => (
          <SelectItem
            key={platform}
            value={platform}
            className={ITEM_CLASS_NAME}
          >
            <PlatformIcon platform={platform} />
            {t(`platform.${platform}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
