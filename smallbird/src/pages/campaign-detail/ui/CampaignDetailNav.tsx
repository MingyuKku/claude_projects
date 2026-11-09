import { Menu, X } from "lucide-react";
import { useState } from "react";

import { SubHeader } from "@/shared/components/app-header";
import { StepSidebar } from "@/shared/components/step-sidebar";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";

export const STEP_KEYS = [
  "campaignInfo",
  "product",
  "influencer",
  "addOns",
  "intro",
  "conditions",
  "policy",
  "payment",
] as const;

interface CampaignDetailSidebarProps {
  size?: "md" | "sm";
  /** 맨 위 "기본정보"는 현재 화면이라 이동 없이 알리기만 하고, 단계 항목은 그 번호(1~8)를 알림. */
  onSelectSection: (sectionNumber: number) => void;
  /** 항목을 고른 뒤(드로어를 닫을 때) 부름. */
  onSelected?: () => void;
  className?: string;
}

// 등록 내역 사이드바(Figma Sidebar / Sub): 맨 위 "기본정보"(현재)와 8단계(모두 완료 표시). 단계를 누르면 그 섹션으로 스크롤함.
export function CampaignDetailSidebar({
  size = "md",
  onSelectSection,
  onSelected,
  className,
}: CampaignDetailSidebarProps) {
  const { t } = useTranslation("pages/campaign-detail");

  return (
    <StepSidebar
      navLabel={t("sidebar.label")}
      size={size}
      className={className}
      header={{ id: "summary", label: t("sidebar.summary"), isCurrent: true }}
      items={STEP_KEYS.map((key, index) => ({
        id: key,
        label: t(`sidebar.steps.${key}`),
        number: index + 1,
        state: "done" as const,
      }))}
      onSelect={(id) => {
        onSelected?.();
        const index = STEP_KEYS.findIndex((key) => key === id) + 1;
        if (index > 0) onSelectSection(index);
      }}
    />
  );
}

// 모바일(768 미만) 서브 헤더(Figma 7555:435605): "≡" + "기본정보". ≡로 단계 목록 드로어를 엶(임시저장은 이 화면에 없음, 스펙 D-10).
export function CampaignDetailMobileHeader({
  onSelectSection,
}: {
  onSelectSection: (sectionNumber: number) => void;
}) {
  const { t } = useTranslation("pages/campaign-detail");
  const { t: tCommon } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <SubHeader
        variant="list"
        className="shrink-0 tablet:hidden"
        title={
          <>
            <Button
              variant="outline-foreground"
              size="icon-sm"
              aria-label={t("sidebar.open")}
              onClick={() => setIsOpen(true)}
            >
              <Menu />
            </Button>
            <span className="ml-2">{t("sidebar.summary")}</span>
          </>
        }
      />
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          overlayClassName="bg-foreground/10"
          aria-describedby={undefined}
          className="w-55.5 gap-0 p-0"
        >
          <SheetTitle className="sr-only">{t("sidebar.label")}</SheetTitle>
          <div className="flex min-h-0 flex-1 flex-col bg-muted/40">
            <div className="flex justify-end py-1 pr-0.5">
              <Button
                variant="ghost-foreground"
                size="icon"
                aria-label={tCommon("action.close")}
                onClick={() => setIsOpen(false)}
              >
                <X />
              </Button>
            </div>
            <CampaignDetailSidebar
              size="sm"
              className="px-4"
              onSelectSection={onSelectSection}
              onSelected={() => setIsOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
