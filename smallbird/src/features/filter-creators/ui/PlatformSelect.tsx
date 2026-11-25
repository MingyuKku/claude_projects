import { ChevronDown } from "lucide-react";

import { usePlatformName, useCreatorTerms } from "@/entities/creator";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { useTranslation } from "@/shared/i18n";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import {
  FILTER_MENU_ITEM_CLASS_NAME,
  FILTER_TRIGGER_CLASS_NAME,
} from "./filter-menu";
import { FilterMenuContent } from "./FilterMenuContent";

import type { MatchingPlatform } from "@/entities/creator";

interface PlatformSelectProps {
  /** 메뉴 순서대로. */
  platforms: MatchingPlatform[];
  /** undefined면 전체 플랫폼. */
  platformIdx: number | undefined;
  isDisabled?: boolean;
  /** 고른 게 없을 때 트리거 문구. 없으면 `플랫폼`. */
  placeholder?: string;
  /** undefined면 전체 플랫폼. */
  onChangePlatform: (platform: MatchingPlatform | undefined) => void;
}

// 하나만 고름(다른 항목을 누르면 바뀜). 고른 항목을 다시 누르면 해제해 전체 플랫폼으로 검색함.
// Radix Select는 고른 항목을 다시 눌러도 알리지 않아 체크 메뉴로 만듦.
export function PlatformSelect({
  platforms,
  platformIdx,
  isDisabled = false,
  placeholder,
  onChangePlatform,
}: PlatformSelectProps) {
  const { t } = useTranslation("features/filter-creators");
  const { term } = useCreatorTerms();

  const getPlatformName = usePlatformName();

  const selected = platforms.find((item) => item.platformIdx === platformIdx);

  function renderLabel(platform: MatchingPlatform) {
    return (
      <span className="flex min-w-0 items-center gap-1.5">
        {platform.code && <PlatformIcon platform={platform.code} />}
        <span className="truncate">{getPlatformName(platform)}</span>
      </span>
    );
  }

  return (
    <div className="min-w-0 flex-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isDisabled}>
          <button
            type="button"
            aria-label={
              selected
                ? t("toolbar.selected", {
                    label: term("platform"),
                    value: getPlatformName(selected),
                  })
                : term("platform")
            }
            className={FILTER_TRIGGER_CLASS_NAME}
          >
            {selected ? (
              renderLabel(selected)
            ) : (
              <span className="truncate">
                {placeholder ?? term("platform")}
              </span>
            )}
            <ChevronDown aria-hidden className="size-4 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <FilterMenuContent itemCount={platforms.length}>
          {platforms.map((platform) => (
            <DropdownMenuCheckboxItem
              key={platform.platformIdx}
              className={FILTER_MENU_ITEM_CLASS_NAME}
              checked={platform.platformIdx === platformIdx}
              onCheckedChange={(isChecked) =>
                onChangePlatform(isChecked ? platform : undefined)
              }
            >
              {renderLabel(platform)}
            </DropdownMenuCheckboxItem>
          ))}
        </FilterMenuContent>
      </DropdownMenu>
    </div>
  );
}
