import { ChevronDown } from "lucide-react";

import { INFLUENCER_PLATFORMS, PlatformIcon } from "@/entities/platform";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import type { InfluencerPlatform } from "@/entities/platform";

interface PlatformSelectProps {
  value?: InfluencerPlatform;
  onChange: (platform: InfluencerPlatform) => void;
}

// Figma Dropdown Menu(5180:87540): 선택 항목은 오른쪽 ✓. 선택 해제는 지원하지 않으므로 선택된 항목을 다시 눌러도 그대로.
export function PlatformSelect({ value, onChange }: PlatformSelectProps) {
  const { t } = useTranslation("features/search-influencer");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="pl-3">
          {value ? (
            <>
              <PlatformIcon platform={value} className="size-4" />
              {t(`platform.${value}`)}
            </>
          ) : (
            t("platform.label")
          )}
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-56 w-50">
        {INFLUENCER_PLATFORMS.map((platform) => (
          <DropdownMenuCheckboxItem
            key={platform}
            checked={value === platform}
            onCheckedChange={(checked) => {
              if (checked) onChange(platform);
            }}
          >
            <PlatformIcon platform={platform} />
            {t(`platform.${platform}`)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
