import { XIcon } from "lucide-react";
import { useState } from "react";

import { SubHeader } from "@/shared/components/app-header";
import { AlignJustifyIcon } from "@/shared/components/icons";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/shared/ui/sheet";

import { RegisterStepNav } from "./RegisterStepNav";

interface RegisterMobileHeaderProps {
  title: string;
  onClickSave: () => void;
}

// MO 서브 헤더(Figma `Header / Sub / Mobile` Type=List): "≡"(단계 드로어) + 단계 제목 + "임시저장".
// 드로어는 왼쪽 222px(Figma `Sidebar / Sub / Mobile`), 단계를 고르면 닫힘.
export function RegisterMobileHeader({
  title,
  onClickSave,
}: RegisterMobileHeaderProps) {
  const { t } = useTranslation("features/register-campaign");
  const { t: tCommon } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <SubHeader
        variant="list"
        className="tablet:hidden"
        title={
          <span className="flex min-w-0 items-center gap-3">
            <Button
              variant="outline-foreground"
              size="icon-sm"
              aria-label={t("nav.open")}
              onClick={() => setIsDrawerOpen(true)}
            >
              <AlignJustifyIcon className="size-4" />
            </Button>
            <h2 className="truncate">{title}</h2>
          </span>
        }
        actions={
          <Button variant="outline-foreground" size="sm" onClick={onClickSave}>
            {t("action.saveDraft")}
          </Button>
        }
      />
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-55.5 max-w-none border-r-0 tablet:max-w-none"
        >
          <SheetTitle className="sr-only">{t("nav.label")}</SheetTitle>
          <div className="flex h-full flex-col bg-muted/40">
            <div className="flex h-12 shrink-0 items-center justify-end pt-1 pr-0.5 pb-1">
              <SheetClose asChild>
                <Button
                  variant="ghost-muted"
                  size="icon"
                  aria-label={tCommon("action.close")}
                >
                  <XIcon className="size-4 text-foreground" />
                </Button>
              </SheetClose>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              <RegisterStepNav
                size="sm"
                onSelected={() => setIsDrawerOpen(false)}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
