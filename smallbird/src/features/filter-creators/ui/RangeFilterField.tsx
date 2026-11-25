import { useId, useState } from "react";

import { formatNumber, useTranslation } from "@/shared/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Input } from "@/shared/ui/input";
import { Slider } from "@/shared/ui/slider";

import {
  isInvalidRange,
  parseRangeText,
  sanitizeRangeText,
  toRangeValue,
} from "../lib/range-value";

import type { RangeFilterRule, RangeValue } from "@/entities/creator";

type RangeSide = "min" | "max";

interface RangeFilterFieldProps {
  rule: RangeFilterRule;
  label: string;
  /** undefined면 조건 없음(입력칸은 placeholder). */
  value: RangeValue | undefined;
  onChangeValue: (value: RangeValue | undefined) => void;
}

// 슬라이더와 최소·최대 입력이 같은 값을 가리킴. 입력 중인 칸은 친 글자를 그대로 두고, 벗어나면 숫자 표기로 돌아감.
// 최소가 최대보다 큰 채로 칸을 벗어나면 알럿을 띄우고, 확인하면 방금 친 칸을 비움(다시 고치기 전까지 빈칸으로 보임).
export function RangeFilterField({
  rule,
  label,
  value,
  onChangeValue,
}: RangeFilterFieldProps) {
  const { t } = useTranslation("features/filter-creators");
  const { t: tCommon } = useTranslation();
  const labelId = useId();
  const [editing, setEditing] = useState<{
    side: RangeSide;
    text: string;
  } | null>(null);
  const [invalidSide, setInvalidSide] = useState<RangeSide | null>(null);
  const [blankSide, setBlankSide] = useState<RangeSide | null>(null);

  const min = value?.min ?? 0;
  const max = value?.max ?? null;
  const isInvalid = isInvalidRange(value);

  function formatSide(side: RangeSide) {
    if (!value || side === blankSide) return "";
    if (side === "min") return formatNumber(min);
    if (max !== null) return formatNumber(max);
    return rule.isBounded ? formatNumber(rule.sliderMax) : t("input.unlimited");
  }

  function handleChangeText(side: RangeSide, text: string) {
    const sanitized = sanitizeRangeText(rule, text);
    if (sanitized === null) return;
    setEditing({ side, text: sanitized });
    if (side === blankSide) setBlankSide(null);
    const number = parseRangeText(sanitized);
    onChangeValue(
      side === "min"
        ? toRangeValue(rule, number ?? 0, max)
        : toRangeValue(rule, min, number),
    );
  }

  function handleChangeSlider([
    nextMin = 0,
    nextMax = rule.sliderMax,
  ]: number[]) {
    setEditing(null);
    setBlankSide(null);
    onChangeValue(toRangeValue(rule, nextMin, nextMax));
  }

  // 기본값(최소 0·최대 끝)이 보이는 칸은 들어가면 비워서, 친 숫자가 `100`·`0` 뒤에 붙지 않게 함.
  function handleFocus(side: RangeSide) {
    const isDefault = side === "min" ? min === 0 : max === null;
    if (isDefault) setEditing({ side, text: "" });
  }

  function handleBlur(side: RangeSide) {
    setEditing(null);
    // 알럿이 초점을 가져가며 옮겨 간 칸도 벗어나므로, 먼저 벗어난 칸(방금 친 칸)을 지킴.
    if (isInvalid) setInvalidSide((current) => current ?? side);
  }

  function handleConfirmInvalid() {
    if (invalidSide === "min") onChangeValue(toRangeValue(rule, 0, max));
    if (invalidSide === "max") onChangeValue(toRangeValue(rule, min, null));
    setBlankSide(invalidSide);
    setInvalidSide(null);
  }

  function renderInput(side: RangeSide) {
    return (
      <Input
        inputSize="sm"
        inputMode={rule.hasDecimal ? "decimal" : "numeric"}
        aria-label={t(side === "min" ? "input.minLabel" : "input.maxLabel", {
          label,
        })}
        aria-invalid={isInvalid || undefined}
        placeholder={t(side === "min" ? "input.min" : "input.max")}
        value={editing?.side === side ? editing.text : formatSide(side)}
        onChange={(event) => handleChangeText(side, event.target.value)}
        onFocus={() => handleFocus(side)}
        onBlur={() => handleBlur(side)}
      />
    );
  }

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className="flex flex-col ds-gap-2"
    >
      <p id={labelId} className="text-sm leading-5 font-medium text-foreground">
        {label}
      </p>
      <div className="flex flex-col ds-gap-3">
        <Slider
          min={0}
          max={rule.sliderMax}
          step={rule.hasDecimal ? 0.1 : 1}
          value={[min, max ?? rule.sliderMax]}
          aria-label={label}
          onValueChange={handleChangeSlider}
        />
        <div className="flex items-center ds-gap-1.5">
          {renderInput("min")}
          <span aria-hidden className="ds-text-sm-5-normal text-foreground">
            ~
          </span>
          {renderInput("max")}
        </div>
      </div>
      <AlertDialog open={invalidSide !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("invalidRange.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("invalidRange.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleConfirmInvalid}>
              {tCommon("action.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
