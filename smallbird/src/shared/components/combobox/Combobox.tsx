import { cva } from "class-variance-authority";
import { ChevronsUpDown } from "lucide-react";
import { useId, useState } from "react";

import { FormField } from "@/shared/components/form-field";
import { useMediaQuery } from "@/shared/lib/useMediaQuery";
import { cn } from "@/shared/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer";
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
  /** 검색 입력을 보일지. 선택지가 몇 개 안 되면 끔. */
  isSearchable?: boolean;
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
  isSearchable = true,
  disabled = false,
  className,
  ...triggerProps
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  // MO는 아래에서 올라오는 시트로 엶(Figma 6790:131258·6791:72753, 디자인 시스템 Drawer "MO 필터 선택")
  const isMobile = !useMediaQuery("(min-width: 768px)");
  const listId = useId();
  const isInvalid = Boolean(errorText);
  const selectedLabel = options.find((option) => option.value === value)?.label;

  const handleSelectOption = (nextValue: string) => {
    onValueChange?.(nextValue);
    setIsOpen(false);
  };

  function renderTrigger(control: object) {
    return (
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
          <span className="mr-2 flex shrink-0 [&_svg]:size-4">{icon}</span>
        )}
        <span className="min-w-0 flex-1 truncate">
          {selectedLabel ?? placeholder}
        </span>
        <ChevronsUpDown className="ml-4 size-4 shrink-0" />
      </button>
    );
  }

  function renderCommand(listClassName?: string) {
    return (
      <Command>
        {isSearchable && <CommandInput placeholder={searchPlaceholder} />}
        <CommandList className={listClassName}>
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
        isMobile ? (
          <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>{renderTrigger(control)}</DrawerTrigger>
            {/* 손잡이 아래 위·아래 16, 목록 좌우 16, 8개(36씩 + 위아래 여백)를 넘으면 스크롤 */}
            <DrawerContent id={listId} className="px-4 pb-4">
              <DrawerTitle className="sr-only">
                {label ?? placeholder}
              </DrawerTitle>
              <div className="pt-4">{renderCommand("max-h-74")}</div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>{renderTrigger(control)}</PopoverTrigger>
            <PopoverContent
              id={listId}
              className="w-(--radix-popover-trigger-width) rounded-lg p-0"
            >
              {renderCommand()}
            </PopoverContent>
          </Popover>
        )
      }
    </FormField>
  );
}
