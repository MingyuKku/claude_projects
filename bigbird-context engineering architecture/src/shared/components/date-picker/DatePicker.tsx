import { cva } from "class-variance-authority";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

import { FormField } from "@/shared/components/form-field";
import { formatDate } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Calendar } from "@/shared/ui/calendar";
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
  calendarProps,
  className,
  ...triggerProps
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectDate = (nextValue: Date | undefined) => {
    onValueChange?.(nextValue);
    setIsOpen(false);
  };

  return (
    <FormField
      label={label}
      helpText={helpText}
      errorText={errorText}
      disabled={disabled}
      className={className}
    >
      {(control) => (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button
              {...triggerProps}
              {...control}
              type="button"
              className={cn(triggerVariants({ isInvalid: Boolean(errorText) }))}
            >
              {icon && (
                <span className="mr-2 flex shrink-0 [&_svg]:size-4">
                  {icon}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate">
                {value ? formatValue(value) : placeholder}
              </span>
              <CalendarIcon className="ml-4 size-4 shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto border-0 p-0">
            <Calendar
              {...calendarProps}
              mode="single"
              selected={value}
              onSelect={handleSelectDate}
            />
          </PopoverContent>
        </Popover>
      )}
    </FormField>
  );
}
