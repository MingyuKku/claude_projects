import { useState } from "react";

import chevronDown from "@/shared/assets/img/system/chevron-down.svg";
import { AuthText } from "@/shared/components/auth";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { useCategoryList } from "../api/use-category-list";

interface CategorySelectProps {
  value: string | null;
  onChangeCategory: (categoryId: string) => void;
  className?: string;
}

/**
 * shadcn `select` is not used because the auth screens must follow their own input
 * height and border tokens. The listbox role and aria state are filled by hand instead.
 */
export function CategorySelect({
  value,
  onChangeCategory,
  className,
}: CategorySelectProps) {
  const { t } = useTranslation("features/join");
  const [isOpen, setIsOpen] = useState(false);
  const { categories } = useCategoryList();
  const selectedName = categories.find(
    (category) => String(category.id) === value,
  )?.name;

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-11 w-full items-center justify-between rounded-auth-lg border border-line1 bg-light px-3"
      >
        <AuthText as="span" size="sm">
          {selectedName || t("company.categoryPlaceholder")}
        </AuthText>
        <span className="flex size-6 shrink-0 items-center justify-center">
          <img src={chevronDown} alt="" className="h-[9px] w-[18px]" />
        </span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute top-[calc(100%+4px)] left-0 z-10 max-h-36 w-full overflow-y-auto rounded-auth-lg bg-light py-2.5 shadow-normal"
        >
          {categories.map((category) => {
            const isSelected = String(category.id) === value;
            return (
              <button
                key={category.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChangeCategory(String(category.id));
                  setIsOpen(false);
                }}
                className={cn(
                  "flex h-9 w-full items-center px-[15px]",
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
    </div>
  );
}
