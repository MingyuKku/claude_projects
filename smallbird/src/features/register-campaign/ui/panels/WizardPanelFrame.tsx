import { X } from "lucide-react";

import { SubHeader } from "@/shared/components/app-header";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";

import type { ReactNode } from "react";

interface WizardPanelFrameProps {
  title: string;
  /** PC 드로어의 너비 클래스(브랜드 추가 362px, 이전 캠페인 불러오기 799px). */
  drawerWidthClassName: string;
  /** PC는 오른쪽 드로어, 그 밖에는 본문을 대체하는 서브 화면. */
  isDrawer: boolean;
  onClose: () => void;
  children: ReactNode;
}

function PanelHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  return (
    <SubHeader
      title={<h2 className="min-w-0 truncate">{title}</h2>}
      actions={
        <Button
          type="button"
          variant="ghost-foreground"
          size="icon"
          className="tablet:size-12 tablet:[&_svg:not([class*='size-'])]:size-6"
          aria-label={t("action.close")}
          onClick={onClose}
        >
          <X />
        </Button>
      }
    />
  );
}

// 하위 화면의 틀(Figma Drawer 7555:333881, TAB·MO 서브 화면 7555:393227·7555:422685). 내용은 `PanelBody`·`PanelFooter`로 배치함.
export function WizardPanelFrame({
  title,
  drawerWidthClassName,
  isDrawer,
  onClose,
  children,
}: WizardPanelFrameProps) {
  if (isDrawer) {
    return (
      <Sheet
        open
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          overlayClassName="bg-foreground/10"
          aria-describedby={undefined}
          className={`${drawerWidthClassName} gap-0 p-0 tablet:max-w-none`}
        >
          <SheetTitle className="sr-only">{title}</SheetTitle>
          <PanelHeader title={title} onClose={onClose} />
          {children}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PanelHeader title={title} onClose={onClose} />
      {children}
    </div>
  );
}
