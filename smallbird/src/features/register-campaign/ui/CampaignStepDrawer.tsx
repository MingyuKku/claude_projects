import { X } from "lucide-react";

import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";

import { useCurrentStep } from "../model/use-current-step";
import { CampaignStepSidebar } from "./CampaignStepSidebar";

interface CampaignStepDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 모바일(768 미만)에서 서브 헤더의 "≡"로 여는 왼쪽 드로어(Figma Sidebar / Sub / Mobile 7701:251947, 222px, 우상단 "×").
export function CampaignStepDrawer({
  open,
  onOpenChange,
}: CampaignStepDrawerProps) {
  const { t } = useTranslation("features/register-campaign");
  const { t: tCommon } = useTranslation();
  const { step } = useCurrentStep();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        showCloseButton={false}
        overlayClassName="bg-foreground/10"
        aria-describedby={undefined}
        className="w-55.5 gap-0 p-0"
      >
        <SheetTitle className="sr-only">
          {step ? t(step.titleKey) : t("sidebar.label")}
        </SheetTitle>
        {/* 시안(Sidebar / Sub / Mobile)은 흰 바탕 위에 회색 40%라 불투명함. 반투명 회색만 두면 뒤의 화면이 비침. */}
        <div className="flex min-h-0 flex-1 flex-col bg-muted/40">
          <div className="flex justify-end py-1 pr-0.5">
            <Button
              variant="ghost-foreground"
              size="icon"
              aria-label={tCommon("action.close")}
              onClick={() => onOpenChange(false)}
            >
              <X />
            </Button>
          </div>
          <CampaignStepSidebar
            size="sm"
            className="px-4"
            onSelected={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
