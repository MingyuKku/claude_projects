import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { FormField } from "@/shared/components/form-field";
import { MEDIA_QUERY } from "@/shared/config";
import {
  fieldFocusRingClassName,
  fieldOpenRingClassName,
  useMediaQuery,
} from "@/shared/lib";
import { cn } from "@/shared/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

import type { FormFieldControlProps } from "@/shared/components/form-field";

export interface SelectOption {
  value: number;
  label: string;
}

interface OptionSelectProps {
  label: string;
  placeholder: string;
  options: readonly SelectOption[];
  value: number | null;
  onChangeValue: (value: number) => void;
  disabled?: boolean;
}

// 항목 하나를 고르는 선택 칸(브랜드 선택과 같은 모양). PC·TAB은 입력 아래 팝오버, MO는 바텀시트.
export function OptionSelect({
  label,
  placeholder,
  options,
  value,
  onChangeValue,
  disabled = false,
}: OptionSelectProps) {
  const isTabletUp = useMediaQuery(MEDIA_QUERY.tabletUp);
  const [isOpen, setIsOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

  function handleSelect(nextValue: number) {
    onChangeValue(nextValue);
    setIsOpen(false);
  }

  function renderTrigger(control: FormFieldControlProps) {
    return (
      <button
        {...control}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          "flex h-10 w-full items-center gap-4 rounded-md border border-input bg-background px-3 text-left text-sm leading-5 text-foreground transition-[color,background-color,border-color,box-shadow] outline-none hover:bg-accent",
          fieldFocusRingClassName,
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-background",
          fieldOpenRingClassName,
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            !selected && "text-muted-foreground",
          )}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0" aria-hidden />
      </button>
    );
  }

  const menu = (
    <div
      role="listbox"
      aria-label={label}
      className="flex max-h-72 flex-col overflow-y-auto"
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={isSelected}
            className={cn(
              "flex min-h-9 w-full shrink-0 items-center rounded-sm px-2 py-1.5 text-left text-sm leading-5 text-foreground outline-none hover:bg-accent focus-visible:bg-accent",
              isSelected && "bg-accent",
            )}
            onClick={() => handleSelect(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <FormField label={label} isRequired>
      {(control) =>
        isTabletUp ? (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>{renderTrigger(control)}</PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-(--radix-popover-trigger-width) p-1"
            >
              {menu}
            </PopoverContent>
          </Popover>
        ) : (
          <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>{renderTrigger(control)}</DrawerTrigger>
            <DrawerContent className="px-4 pt-4 pb-6">
              <DrawerTitle className="sr-only">{label}</DrawerTitle>
              {menu}
            </DrawerContent>
          </Drawer>
        )
      }
    </FormField>
  );
}
