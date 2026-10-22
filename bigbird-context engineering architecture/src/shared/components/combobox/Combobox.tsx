import { cva } from "class-variance-authority";
import { ChevronsUpDown } from "lucide-react";
import { useId, useState } from "react";

import { FormField } from "@/shared/components/form-field";
import { cn } from "@/shared/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

import type { ComponentProps, ReactNode } from "react";

// Figma 디자인 시스템 Combobox(6777:61876). Size md 40 / sm 36, 오류 문구가 있으면 Destructive.
const triggerVariants = cva(
  "flex w-full items-center rounded-md border border-input bg-background px-3 text-left text-sm leading-5 text-foreground outline-none transition-colors hover:bg-accent focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-background data-[state=open]:ring-2 data-[state=open]:ring-primary data-[state=open]:ring-offset-2",
  {
    variants: {
      size: {
        md: "h-10 py-2.5",
        sm: "h-9 py-2",
      },
      isInvalid: {
        true: "focus-visible:ring-destructive data-[state=open]:ring-destructive",
        false: "",
      },
    },
    defaultVariants: { size: "md", isInvalid: false },
  },
);

export interface ComboboxOption {
  value: string;
  label: string;
}

// 나머지 속성(data-*, aria-* 등)은 트리거 버튼에 전달함.
interface ComboboxProps extends Omit<
  ComponentProps<"button">,
  "value" | "onChange" | "children" | "type" | "role"
> {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  label?: string;
  helpText?: string;
  errorText?: string;
  icon?: ReactNode;
  size?: "md" | "sm";
  disabled?: boolean;
  className?: string;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  label,
  helpText,
  errorText,
  icon,
  size = "md",
  disabled = false,
  className,
  ...triggerProps
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const listId = useId();
  const isInvalid = Boolean(errorText);
  const selectedLabel = options.find((option) => option.value === value)?.label;

  const handleSelectOption = (nextValue: string) => {
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
              role="combobox"
              aria-expanded={isOpen}
              aria-controls={listId}
              className={cn(triggerVariants({ size, isInvalid }))}
            >
              {icon && (
                <span className="mr-2 flex shrink-0 [&_svg]:size-4">
                  {icon}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate">
                {selectedLabel ?? placeholder}
              </span>
              <ChevronsUpDown className="ml-4 size-4 shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            id={listId}
            className="w-(--radix-popover-trigger-width) rounded-lg p-0"
          >
            <Command>
              <CommandInput placeholder={searchPlaceholder} />
              <CommandList>
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    // cmdk 는 value 로 항목을 구분하므로 라벨이 같은 옵션도 따로 선택되도록 value 는 유일한 값을 쓰고,
                    // 검색은 keywords 로 라벨에 맞춤.
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      keywords={[option.label]}
                      onSelect={() => handleSelectOption(option.value)}
                    >
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </FormField>
  );
}
