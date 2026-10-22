"use client"

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import * as React from "react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from "react-day-picker"
import {
  enUS,
  ja,
  ko,
  zhCN,
  type DayPickerLocale,
} from "react-day-picker/locale"

import { formatDate, useLanguage, type Language } from "@/shared/i18n"
import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"

// 현재 언어의 월·요일 이름을 씀. 호출부에서 locale 을 넘기면 그 값이 우선함.
const DAY_PICKER_LOCALES: Record<Language, DayPickerLocale> = {
  ko,
  en: enUS,
  ja,
  "zh-CN": zhCN,
}

// Figma 디자인 시스템 Calendar(6777:63386).
// 셀 36px, 주 간격 8px, 테두리 반경 6px. 날짜 상태는 Calenday Base(6777:63594) 기준:
// 선택·범위 양 끝 = primary, 범위 중간 = muted(주의 첫·끝 칸만 둥글게), 오늘 = muted,
// 이번 달 밖·비활성 날짜 = 투명도 50%.
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const language = useLanguage()
  const defaultClassNames = getDefaultClassNames()
  const navButtonClassName = cn(
    buttonVariants({ variant: "outline-foreground", size: "icon-xs" }),
    "select-none aria-disabled:pointer-events-none aria-disabled:opacity-50"
  )

  // 칸 최소 36px(--cell-size, w-fit). 넓은 컨테이너(Figma Drawer)에서는 칸이 고르게 늘어남.
  // 좁은 곳은 --cell-size를 줄여 맞춤(예: With Presets).
  return (
    <DayPicker
      locale={DAY_PICKER_LOCALES[language]}
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar w-fit rounded-md border bg-background p-3 [--cell-size:--spacing(9)]",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) => formatDate(date, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn(defaultClassNames.root),
        months: cn(
          "relative flex w-full flex-col gap-4 tablet:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-1", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex h-9 items-center justify-between px-2.5",
          defaultClassNames.nav
        ),
        button_previous: cn(navButtonClassName, defaultClassNames.button_previous),
        button_next: cn(navButtonClassName, defaultClassNames.button_next),
        month_caption: cn(
          "flex h-9 w-full items-center justify-center px-10",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-9 w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative rounded-md border border-input has-focus-visible:ring-2 has-focus-visible:ring-primary has-focus-visible:ring-offset-2",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute inset-0 bg-popover opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "text-sm leading-6 font-medium text-foreground select-none",
          captionLayout !== "label" &&
            "flex h-7 items-center gap-1 rounded-md pr-1 pl-2 [&>svg]:size-3.5 [&>svg]:text-muted-foreground",
          defaultClassNames.caption_label
        ),
        month_grid: cn("mx-1 mb-1.5 flex flex-col", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "min-w-(--cell-size) flex-1 text-xs leading-5 font-normal text-muted-foreground select-none",
          defaultClassNames.weekday
        ),
        week: cn("mt-2 flex", defaultClassNames.week),
        week_number_header: cn(
          "w-(--cell-size) select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-xs leading-5 text-muted-foreground select-none",
          defaultClassNames.week_number
        ),
        day: cn(
          "relative flex h-(--cell-size) min-w-(--cell-size) flex-1 justify-center rounded-md p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-md",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-md"
            : "[&:first-child[data-selected=true]_button]:rounded-l-md",
          defaultClassNames.day
        ),
        range_start: defaultClassNames.range_start,
        range_middle: defaultClassNames.range_middle,
        range_end: defaultClassNames.range_end,
        today: cn("[&_button]:bg-muted", defaultClassNames.today),
        outside: cn("opacity-50", defaultClassNames.outside),
        disabled: cn("opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

// edge = 단일 선택·범위 시작·범위 끝(primary), middle = 범위 중간(muted).
function getSelectionKind(
  modifiers: React.ComponentProps<typeof DayButton>["modifiers"]
) {
  if (modifiers.range_middle) return "middle"
  if (modifiers.selected || modifiers.range_start || modifiers.range_end) {
    return "edge"
  }
  return undefined
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  // 선택 상태는 hover·focus 배경보다 우선해야 하므로 같은 변형을 겹쳐 명시도를 올림.
  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toLocaleDateString()}
      data-selection={getSelectionKind(modifiers)}
      className={cn(
        "flex h-(--cell-size) w-full max-w-(--cell-size) items-center justify-center rounded-md text-sm leading-6 font-normal text-foreground transition-colors outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none",
        "data-[selection=edge]:bg-primary data-[selection=edge]:text-primary-foreground data-[selection=edge]:hover:bg-primary data-[selection=edge]:focus-visible:bg-primary",
        "data-[selection=middle]:rounded-none data-[selection=middle]:bg-muted",
        defaultClassNames.day_button,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
