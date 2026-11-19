import { Check, ChevronDown, Globe } from "lucide-react";

import { MEDIA_QUERY } from "@/shared/config";
import { useMediaQuery } from "@/shared/lib/useMediaQuery";
import { useMenuFocusReturn } from "@/shared/lib/useMenuFocusReturn";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import type { ComponentProps } from "react";

interface LanguageOption {
  value: string;
  // 트리거에 보이는 짧은 코드 (예: KO)
  code: string;
  // 메뉴 항목에 보이는 언어 이름
  label: string;
}

interface LanguageMenuProps {
  value: string;
  options: LanguageOption[];
  // 트리거 버튼의 접근성 이름. 화면에 보이는 언어 코드를 뒤에 붙임.
  menuLabel: string;
  onChangeLanguage: (value: string) => void;
  /** 메뉴가 열리는 방향. 화면 아래쪽에 놓이는 버튼(LNB 하단)은 "top". */
  contentSide?: "top" | "bottom";
  contentAlign?: "start" | "end";
  /** 모바일(tablet 미만)에서는 메뉴 대신 화면 아래에서 올라오는 드로어로 엶. */
  isDrawerOnMobile?: boolean;
}

const ITEM_CLASS_NAME = "h-9 gap-2";
// 열려 있는 동안 트리거에 포커스 링을 보임(Select·Combobox와 같은 규칙). 메뉴가 열리면 포커스가 메뉴 안으로 가서 focus-visible 로는 안 보임.
const OPEN_RING_CLASS_NAME =
  "data-[state=open]:ring-2 data-[state=open]:ring-primary data-[state=open]:ring-offset-2";
// Button 의 트랜지션에는 box-shadow 가 없어 링이 갑자기 나타나므로, Select·Combobox 처럼 링도 같이 전환함.
const RING_TRANSITION_CLASS_NAME =
  "transition-[color,background-color,border-color,box-shadow,transform]";

function OptionContent({
  label,
  isSelected,
}: {
  label: string;
  isSelected: boolean;
}) {
  return (
    <>
      <span className="flex-1">{label}</span>
      {isSelected && <Check className="size-4 shrink-0 text-primary" />}
    </>
  );
}

function LanguageTrigger({
  code,
  className,
  ...props
}: ComponentProps<typeof Button> & { code?: string }) {
  return (
    <Button
      variant="outline-foreground"
      size="sm"
      className={cn("cursor-pointer", RING_TRANSITION_CLASS_NAME, className)}
      {...props}
    >
      <Globe />
      {code}
      <ChevronDown />
    </Button>
  );
}

export function LanguageMenu({
  value,
  options,
  menuLabel,
  onChangeLanguage,
  contentSide = "bottom",
  contentAlign = "end",
  isDrawerOnMobile = false,
}: LanguageMenuProps) {
  const isTabletUp = useMediaQuery(MEDIA_QUERY.tabletUp);
  const focusReturn = useMenuFocusReturn();
  const current = options.find((option) => option.value === value);
  const triggerLabel = `${menuLabel}, ${current?.code ?? value}`;

  if (isDrawerOnMobile && !isTabletUp) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <LanguageTrigger code={current?.code} aria-label={triggerLabel} />
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle className="sr-only">{menuLabel}</DrawerTitle>
          <div role="group" aria-label={menuLabel} className="px-4 pt-4 pb-4">
            <div className="pt-0.5 pb-1.5">
              {options.map((option) => (
                <DrawerClose key={option.value} asChild>
                  <button
                    type="button"
                    aria-current={option.value === value}
                    lang={option.value}
                    className={cn(
                      ITEM_CLASS_NAME,
                      "flex w-full cursor-pointer items-center rounded-sm p-2 text-left text-sm leading-none outline-hidden hover:bg-accent focus-visible:bg-accent",
                    )}
                    onClick={() => onChangeLanguage(option.value)}
                  >
                    <OptionContent
                      label={option.label}
                      isSelected={option.value === value}
                    />
                  </button>
                </DrawerClose>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        onPointerDown={focusReturn.onPointerDown}
        onKeyDown={focusReturn.onKeyDown}
      >
        <LanguageTrigger
          code={current?.code}
          aria-label={triggerLabel}
          className={OPEN_RING_CLASS_NAME}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={contentSide}
        align={contentAlign}
        className="min-w-47.5"
        onKeyDown={focusReturn.onKeyDown}
        onCloseAutoFocus={focusReturn.onCloseAutoFocus}
      >
        <DropdownMenuRadioGroup value={value} onValueChange={onChangeLanguage}>
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              indicatorPosition="end"
              lang={option.value}
              className={ITEM_CLASS_NAME}
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
