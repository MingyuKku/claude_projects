import { cva } from "class-variance-authority";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

import { FormField } from "@/shared/components/form-field";
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

import type { ComponentProps, ReactNode } from "react";

// Figma 디자인 시스템 Date Picker(6901:49560). 높이 40, 오류 문구가 있으면 Destructive 링.
const triggerVariants = cva(
  "flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-left text-sm leading-5 text-foreground outline-none transition-colors hover:bg-accent focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-background data-[state=open]:ring-2 data-[state=open]:ring-primary data-[state=open]:ring-offset-2",
  {
    variants: {
      isInvalid: {
        true: "focus-visible:ring-destructive data-[state=open]:ring-destructive",
        false: "",
      },
    },
    defaultVariants: { isInvalid: false },
  },
);

// 나머지 속성(data-*, aria-* 등)은 트리거 버튼에 전달함.
interface DatePickerProps extends Omit<
  ComponentProps<"button">,
  "value" | "onChange" | "children" | "type"
> {
  value?: Date;
  onValueChange?: (value: Date | undefined) => void;
  placeholder: string;
  formatValue?: (value: Date) => string;
  label?: string;
  helpText?: string;
  errorText?: string;
  icon?: ReactNode;
  disabled?: boolean;
  /** 캘린더 팝오버를 트리거의 어느 쪽에 맞출지. 기본은 가운데이고, 시안이 오른쪽 정렬이면 end. */
  popoverAlign?: ComponentProps<typeof PopoverContent>["align"];
  /** MO(768 미만)에서 팝오버 대신 아래에서 올라오는 시트로 엶(Figma 캘린더 시트 7555:420549). 기본은 끔. */
  isSheetOnMobile?: boolean;
  calendarProps?: Omit<
    ComponentProps<typeof Calendar>,
    "mode" | "selected" | "onSelect"
  >;
  className?: string;
}

export function DatePicker({
  value,
  onValueChange,
  placeholder,
  formatValue = (date) => formatDate(date),
  label,
  helpText,
  errorText,
  icon,
  disabled = false,
  popoverAlign,
  isSheetOnMobile = false,
  calendarProps,
  className,
  ...triggerProps
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isTabletUp = useMediaQuery("(min-width: 768px)");
  const isSheet = isSheetOnMobile && !isTabletUp;

  const handleSelectDate = (nextValue: Date | undefined) => {
    onValueChange?.(nextValue);
    setIsOpen(false);
  };

  function renderTrigger(control: object) {
    return (
      <button
        {...triggerProps}
        {...control}
        type="button"
        className={cn(triggerVariants({ isInvalid: Boolean(errorText) }))}
      >
        {icon && (
          <span className="mr-2 flex shrink-0 [&_svg]:size-4">{icon}</span>
        )}
        <span className="min-w-0 flex-1 truncate">
          {value ? formatValue(value) : placeholder}
        </span>
        <CalendarIcon className="ml-4 size-4 shrink-0" />
      </button>
    );
  }

  return (
    <FormField
      label={label}
      helpText={helpText}
      errorText={errorText}
      disabled={disabled}
      className={className}
    >
      {(control) =>
        isSheet ? (
          <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>{renderTrigger(control)}</DrawerTrigger>
            {/* 손잡이 아래 16, 좌우 8: 캘린더가 폭을 채움(Figma 7555:420549). */}
            <DrawerContent className="px-2 pb-4">
              <DrawerTitle className="sr-only">
                {label ?? placeholder}
              </DrawerTitle>
              <div className="pt-4">
                <Calendar
                  {...calendarProps}
                  className={cn("w-full", calendarProps?.className)}
                  mode="single"
                  selected={value}
                  onSelect={handleSelectDate}
                />
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>{renderTrigger(control)}</PopoverTrigger>
            <PopoverContent
              align={popoverAlign}
              className="w-auto border-0 p-0"
            >
              <Calendar
                {...calendarProps}
                mode="single"
                selected={value}
                onSelect={handleSelectDate}
              />
            </PopoverContent>
          </Popover>
        )
      }
    </FormField>
  );
}
