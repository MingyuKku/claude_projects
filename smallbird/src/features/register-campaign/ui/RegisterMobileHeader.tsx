import { XIcon } from "lucide-react";
import { useState } from "react";

import { SubHeader } from "@/shared/components/app-header";
import { AlignJustifyIcon } from "@/shared/components/icons";
import { ScrollPanel } from "@/shared/components/scroll-panel";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/shared/ui/sheet";

import { RegisterStepNav } from "./RegisterStepNav";

import type { PendingSaveAction } from "../model/store";
import type { RegisterPreviewButtonState } from "./RegisterBottomBar";

interface RegisterMobileHeaderProps {
  title: string;
  /** 5단계 "미리보기". 없으면 그리지 않음. */
  preview: RegisterPreviewButtonState | null;
  /** 없으면 "임시저장"을 그리지 않음(반려 뒤 수정 모드). */
  onClickSave?: () => void;
  /** 저장을 기다리는 동작. "임시저장"이면 Loading, 그 밖의 저장 중에는 막음. */
  pendingSave: PendingSaveAction | null;
}

// 드로어는 왼쪽 222px(Figma `Sidebar / Sub / Mobile`), 단계를 고르면 닫힘.
export function RegisterMobileHeader({
  title,
  preview,
  onClickSave,
  pendingSave,
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
          <span className="flex gap-2">
            {onClickSave && (
              <Button
                variant="outline-foreground"
                size="sm"
                isLoading={pendingSave === "saveDraft"}
                disabled={pendingSave !== null}
                onClick={onClickSave}
              >
                {t("action.saveDraft")}
              </Button>
            )}
            {preview && (
              <Button
                variant="outline-foreground"
                size="sm"
                disabled={!preview.isEnabled}
              >
                {t("action.preview")}
              </Button>
            )}
          </span>
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
            <ScrollPanel className="flex-1" contentClassName="px-4 pb-4">
              <RegisterStepNav
                size="sm"
                onSelected={() => setIsDrawerOpen(false)}
              />
            </ScrollPanel>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
