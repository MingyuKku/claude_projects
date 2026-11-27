import { XIcon } from "lucide-react";
import { useState } from "react";

import { SubHeader } from "@/shared/components/app-header";
import { AlignJustifyIcon } from "@/shared/components/icons";
import { ScrollPanel } from "@/shared/components/scroll-panel";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/shared/ui/sheet";

import { ProgressStepNav } from "./ProgressStepNav";

import type { CampaignDetail, CampaignProgressStep } from "@/entities/campaign";
import type { ReactNode } from "react";

interface ProgressMobileHeaderProps {
  detail: CampaignDetail;
  currentStep: CampaignProgressStep | null;
  title: string;
  /** 오른쪽 버튼(단계마다 다름, 예: 가이드의 건너뛰기·미리보기). */
  actions?: ReactNode;
}

// MO 헤더(시안 13288:433453): 햄버거 + 지금 단계 이름. 드로어는 왼쪽 222px(13288:433622), 단계를 고르면 닫힘.
export function ProgressMobileHeader({
  detail,
  currentStep,
  title,
  actions,
}: ProgressMobileHeaderProps) {
  const { t } = useTranslation("pages/campaign-progress");
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
        actions={actions}
      />
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-55.5 max-w-none border-r-0 tablet:max-w-none"
        >
          <SheetTitle className="sr-only">{t("nav.label")}</SheetTitle>
          <div className="flex h-full flex-col bg-muted/40">
            <div className="flex h-11 shrink-0 items-center justify-end pt-1 pr-0.5">
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
            <ScrollPanel className="flex-1" contentClassName="px-4 pt-1 pb-4">
              <ProgressStepNav
                detail={detail}
                currentStep={currentStep}
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
