import {
  INFLUENCER_PLATFORMS,
  PlatformIcon,
  isInfluencerPlatform,
} from "@/entities/platform";
import { useTranslation } from "@/shared/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import type { InfluencerPlatform } from "@/entities/platform";

interface PlatformSelectProps {
  value: InfluencerPlatform;
  onChange: (platform: InfluencerPlatform) => void;
}

// 입력창 안의 작은 칩 모양 트리거: 공용 SelectTrigger의 폭·글자색·간격만 시안(Text Field 플랫폼 셀렉트)에 맞춤.
// 선택 항목의 ✓는 시안(Dropdown Menu 5180:87540)대로 오른쪽이라 공용 SelectItem의 왼쪽 표시를 이 목록에서만 옮김.
// 선택 해제는 지원하지 않으므로 항상 하나가 선택되어 있음.
const TRIGGER_CLASS_NAME =
  "w-auto justify-start gap-1 pr-2 pl-3 font-medium text-primary *:data-[slot=select-value]:gap-1 [&_[data-slot=select-value]_img]:size-4";
const ITEM_CLASS_NAME =
  "gap-1.5 py-2 pr-8 pl-2 *:data-[slot=select-item-indicator]:right-2 *:data-[slot=select-item-indicator]:left-auto [&_svg:not([class*='text-'])]:text-primary";

export function PlatformSelect({ value, onChange }: PlatformSelectProps) {
  const { t } = useTranslation("features/search-influencer");

  function handleChangeValue(next: string) {
    if (isInfluencerPlatform(next)) onChange(next);
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
        {INFLUENCER_PLATFORMS.map((platform) => (
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
