import { ChevronDown } from "lucide-react";
import { isEqual } from "radash";
import { useState } from "react";

import { COST_FILTER_RULE } from "@/entities/creator";
import { formatNumber, useTranslation } from "@/shared/i18n";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

import { isInvalidRange } from "../lib/range-value";
import { FILTER_TRIGGER_CLASS_NAME } from "./filter-menu";
import { RangeFilterField } from "./RangeFilterField";

import type { RangeValue } from "@/entities/creator";

interface CostFilterPopoverProps {
  label: string;
  /** 고른 금액이 없을 때 트리거 문구. 없으면 label. */
  placeholder?: string;
  value: RangeValue | undefined;
  /** 팝오버를 닫을 때 값이 바뀌었으면 한 번 부름. */
  onChangeValue: (value: RangeValue | undefined) => void;
}

// 최소가 최대보다 큰 동안에는 닫지 않음(칸을 벗어나면 입력 필드가 알럿을 띄움).
export function CostFilterPopover({
  label,
  placeholder = label,
  value,
  onChangeValue,
}: CostFilterPopoverProps) {
  const { t } = useTranslation("features/filter-creators");
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  function getTriggerText() {
    if (!value) return placeholder;
    return t("cost.range", {
      min: formatNumber(value.min),
      max: value.max === null ? "" : formatNumber(value.max),
    }).trim();
  }

  function handleChangeOpen(nextOpen: boolean) {
    if (nextOpen) {
      setDraft(value);
      setIsOpen(true);
      return;
    }
    if (isInvalidRange(draft)) return;
    setIsOpen(false);
    if (!isEqual(draft, value)) onChangeValue(draft);
  }

  return (
    <div className="min-w-0 flex-1">
      <Popover open={isOpen} onOpenChange={handleChangeOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={
              value
                ? t("toolbar.selected", { label, value: getTriggerText() })
                : label
            }
            className={FILTER_TRIGGER_CLASS_NAME}
          >
            <span className="truncate">{getTriggerText()}</span>
            <ChevronDown aria-hidden className="size-4 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80.25 bg-background p-3">
          <RangeFilterField
            rule={COST_FILTER_RULE}
            label={t("cost.title")}
            value={draft}
            onChangeValue={setDraft}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
