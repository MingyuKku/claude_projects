import { CalendarIcon } from "lucide-react";
import { useState } from "react";

import { formatDate } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib/useMediaQuery";
import { cn } from "@/shared/lib/utils";
import { Calendar } from "@/shared/ui/calendar";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

import type { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  value?: DateRange;
  onValueChange: (value: DateRange | undefined) => void;
  placeholder: string;
  disabled?: boolean;
  /** 트리거 버튼의 이름이 되는 라벨 요소의 id. 값이 날짜뿐이라 라벨을 따로 연결해야 합니다. */
  "aria-labelledby"?: string;
  className?: string;
}

// 달력 두 칸이 나란히 들어가는 폭(Calendar의 tablet:flex-row). 그보다 좁으면 한 달만 보여 줍니다.
const TWO_MONTHS_QUERY = "(min-width: 768px)";

// Figma 등록일 달력(6782:88433): 필드 하나에 "시작일 ~ 종료일"을 보여 주고, 열리면 두 달 범위 달력을 띄웁니다.
// 시작일을 누른 뒤 종료일을 고르면 닫힙니다.
export function DateRangePicker({
  value,
  onValueChange,
  placeholder,
  disabled,
  "aria-labelledby": labelledBy,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasTwoMonths = useMediaQuery(TWO_MONTHS_QUERY);

  function handleSelect(next: DateRange | undefined) {
    onValueChange(next);
    if (next?.from && next.to) setIsOpen(false);
  }

  const trigger = (
    <button
      type="button"
      disabled={disabled}
      aria-labelledby={labelledBy}
      className={cn(
        "flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-left text-sm leading-5 font-normal text-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-background data-[state=open]:ring-2 data-[state=open]:ring-primary data-[state=open]:ring-offset-2",
        className,
      )}
    >
      <span className="min-w-0 flex-1 truncate">
        {value?.from
          ? `${formatDate(value.from)}${value.to ? ` ~ ${formatDate(value.to)}` : ""}`
          : placeholder}
      </span>
      <CalendarIcon className="ml-4 size-4 shrink-0" />
    </button>
  );
  const calendar = (
    <Calendar
      mode="range"
      // MO 시트(Figma Calendar 6790:136510)는 패딩 12·날짜 칸 36×36이고 7칸이 시트 폭에 고르게 벌어짐(가로 피치 약 46, 행 간격 8).
      // Calendar는 격자가 내용 폭이라 그대로는 36 간격으로 모이므로, 이 시트에서만 격자를 폭에 채움(칸은 flex-1로 나눠 가짐).
      // 범위 띠는 36폭 버튼이 아니라 칸(td)에 칠해야 칸 사이가 비지 않음(시작·끝은 안쪽 절반만).
      className={
        hasTwoMonths
          ? undefined
          : String.raw`w-full [&_.rdp-month\_grid]:w-full [&_.rdp-range\_end:not(.rdp-range\_start)]:rounded-l-none [&_.rdp-range\_end:not(.rdp-range\_start)]:bg-[linear-gradient(to_right,var(--color-muted)_50%,transparent_50%)] [&_.rdp-range\_middle]:rounded-none [&_.rdp-range\_middle]:bg-muted [&_.rdp-range\_start:not(.rdp-range\_end)]:rounded-r-none [&_.rdp-range\_start:not(.rdp-range\_end)]:bg-[linear-gradient(to_right,transparent_50%,var(--color-muted)_50%)]`
      }
      numberOfMonths={hasTwoMonths ? 2 : 1}
      defaultMonth={value?.from}
      selected={value}
      onSelect={handleSelect}
    />
  );

  // MO는 한 달 달력을 아래 시트로 엶(Figma 6790:138595: 손잡이 아래 위·아래 16, 좌우 8)
  if (!hasTwoMonths) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="px-2 pb-4">
          <DrawerTitle className="sr-only">{placeholder}</DrawerTitle>
          {/* 시안 달력은 시트 폭을 채우고 날짜 격자는 가운데 */}
          <div className="pt-4 *:w-full">{calendar}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="w-auto border-0 p-0">
        {calendar}
      </PopoverContent>
    </Popover>
  );
}
