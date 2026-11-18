import { ChevronDown, Settings } from "lucide-react";
import { useState } from "react";

import { useBrands } from "@/entities/brand";
import { FormField } from "@/shared/components/form-field";
import { MEDIA_QUERY } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

import { useRegisterWizardStore } from "../../../model/wizard-context";

import type { FormFieldControlProps } from "@/shared/components/form-field";

interface BrandSelectProps {
  /** 맨 위 "브랜드 관리"(시안 3.0.5). 넘기지 않으면 그리지 않음. */
  onClickManage?: () => void;
}

// 브랜드명 선택(시안 13320:130043). 맨 위 "브랜드 관리" 아래 등록 브랜드 목록이고 8개를 넘으면 목록 안에서 스크롤함(주석 원문).
// PC·TAB은 입력 아래 팝오버, MO는 바텀시트(MO 주석 "브랜드명 인풋 클릭 > Drawer 호출").
export function BrandSelect({ onClickManage }: BrandSelectProps) {
  const { t } = useTranslation("features/register-campaign");
  const isTabletUp = useMediaQuery(MEDIA_QUERY.tabletUp);
  const { brands } = useBrands();
  const brandIdx = useRegisterWizardStore((state) => state.draft.info.brandIdx);
  const patchStepDraft = useRegisterWizardStore(
    (state) => state.patchStepDraft,
  );
  const [isOpen, setIsOpen] = useState(false);

  const selected = brands?.find((brand) => brand.brandIdx === brandIdx);
  const label = t("info.brand.label");

  function handleSelect(nextBrandIdx: number) {
    patchStepDraft("info", { brandIdx: nextBrandIdx });
    setIsOpen(false);
  }

  function handleClickManage() {
    setIsOpen(false);
    onClickManage?.();
  }

  function renderTrigger(control: FormFieldControlProps) {
    return (
      <button
        {...control}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex h-10 w-full items-center gap-4 rounded-md border border-input bg-background px-3 text-left text-sm leading-5 text-foreground transition-[color,background-color,border-color,box-shadow] outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 data-[state=open]:ring-2 data-[state=open]:ring-primary data-[state=open]:ring-offset-2"
      >
        <span className="min-w-0 flex-1 truncate">
          {selected?.name ?? t("info.brand.placeholder")}
        </span>
        <ChevronDown className="size-4 shrink-0" aria-hidden />
      </button>
    );
  }

  const menu = (
    <div className="flex flex-col">
      {onClickManage && (
        <Button
          variant="ghost"
          size="sm"
          className="justify-start"
          onClick={handleClickManage}
        >
          <Settings aria-hidden />
          {t("info.brand.manage")}
        </Button>
      )}
      <div
        role="listbox"
        aria-label={label}
        // 항목 높이 36 × 8개. 넘으면 목록 안에서 스크롤함.
        className="flex max-h-72 flex-col overflow-y-auto"
      >
        {brands?.map((brand) => {
          const isSelected = brand.brandIdx === brandIdx;
          return (
            <button
              key={brand.brandIdx}
              type="button"
              role="option"
              aria-selected={isSelected}
              className={cn(
                "flex h-9 w-full shrink-0 items-center truncate rounded-sm px-2 text-left text-sm leading-5 text-foreground outline-none hover:bg-accent focus-visible:bg-accent",
                isSelected && "bg-accent",
              )}
              onClick={() => handleSelect(brand.brandIdx)}
            >
              <span className="truncate">{brand.name}</span>
            </button>
          );
        })}
      </div>
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
