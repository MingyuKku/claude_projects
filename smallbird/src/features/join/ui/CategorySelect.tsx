import { useEffect, useRef, useState } from "react";

import chevronDown from "@/shared/assets/img/system/chevron-down.svg";
import { AuthText } from "@/shared/components/auth";
import { useTranslation } from "@/shared/i18n";
import { cn, useMediaQuery } from "@/shared/lib";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";

import { useCategoryList } from "../api/use-category-list";

interface CategorySelectProps {
  value: string | null;
  onChangeCategory: (categoryId: string) => void;
  className?: string;
}

/** 이 너비 미만(모바일)에서는 드롭다운 대신 바텀시트로 고름. 시안 기준 태블릿 경계(768px)와 같음. */
const MOBILE_QUERY = "(max-width: 767px)";

/**
 * shadcn `select`는 인증 화면의 입력 높이·테두리 값과 달라 쓰지 않음.
 * 대신 listbox 역할과 aria 상태를 직접 채움. 태블릿 이상은 드롭다운, 모바일은 바텀시트로 보임.
 */
export function CategorySelect({
  value,
  onChangeCategory,
  className,
}: CategorySelectProps) {
  const { t } = useTranslation("features/join");
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const { categories } = useCategoryList();
  const selectedName = categories.find(
    (category) => String(category.id) === value,
  )?.name;
  const isDropdownOpen = isOpen && !isMobile;

  // 드롭다운은 바깥을 누르거나 Escape를 누르면 닫힘. 바텀시트는 Radix가 같은 동작을 함.
  useEffect(() => {
    if (!isDropdownOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

  function handleSelect(categoryId: number) {
    onChangeCategory(String(categoryId));
    setIsOpen(false);
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-11 w-full items-center justify-between rounded-lg border border-line1 bg-light px-3"
      >
        <AuthText as="span" size="sm">
          {selectedName || t("company.categoryPlaceholder")}
        </AuthText>
        <span className="flex size-6 shrink-0 items-center justify-center">
          <img src={chevronDown} alt="" className="h-[9px] w-[18px]" />
        </span>
      </button>

      {isDropdownOpen && (
        <div
          role="listbox"
          aria-label={t("company.classification")}
          className="absolute top-[calc(100%+0.5rem)] left-0 z-10 max-h-41 w-full overflow-y-auto rounded-lg bg-light py-2.5 shadow-normal"
        >
          {categories.map((category) => {
            const isSelected = String(category.id) === value;
            return (
              <button
                key={category.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(category.id)}
                className={cn(
                  "flex h-9 w-full items-center px-3.75",
                  isSelected && "bg-brand-soft",
                )}
              >
                <AuthText as="span" size="sm">
                  {category.name}
                </AuthText>
              </button>
            );
          })}
        </div>
      )}

      <Sheet open={isOpen && isMobile} onOpenChange={setIsOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          aria-describedby={undefined}
          // shadcn 기본 그림자·위 테두리 대신 시안의 그림자를 씀. 사용자 지정 그림자 이름은 클래스 병합이 못 지워 !로 이김.
          className="gap-2.5 rounded-t-[20px] border-t-0 pb-5 shadow-normal!"
        >
          <SheetTitle className="sr-only">
            {t("company.classification")}
          </SheetTitle>
          <div className="flex h-6 items-center justify-center">
            <div className="h-1 w-11 rounded-sm bg-gray-200" />
          </div>
          <div
            role="listbox"
            aria-label={t("company.classification")}
            className="flex max-h-105 flex-col gap-5 overflow-y-auto px-5"
          >
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                role="option"
                aria-selected={String(category.id) === value}
                onClick={() => handleSelect(category.id)}
                className="flex h-6 shrink-0 items-center px-1 text-left"
              >
                <AuthText as="span" size="fixed-base" weight="medium">
                  {category.name}
                </AuthText>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
