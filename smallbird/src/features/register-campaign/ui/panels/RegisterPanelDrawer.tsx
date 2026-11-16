import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";

import { useRegisterPanel } from "../../model/use-register-panel";
import { RegisterPanelContent } from "./RegisterPanelContent";

import type { RegisterPanel } from "../../model/use-register-panel";

const PANEL_TITLE_KEYS = {
  brands: "brands.title",
  "add-brand": "brands.title",
  "load-previous": "loadPrevious.title",
} as const satisfies Record<RegisterPanel, string>;

// PC(1440 이상) 하위 화면: 오른쪽 드로어(딤). 폭은 시안 그대로 브랜드 관리 362, 이전 캠페인 불러오기 798.
export function RegisterPanelDrawer() {
  const { t } = useTranslation("features/register-campaign");
  const { panel, closePanel } = useRegisterPanel();

  return (
    <Sheet
      open={panel !== null}
      onOpenChange={(isOpen) => !isOpen && closePanel()}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        aria-describedby={undefined}
        className={cn(
          "max-w-none tablet:max-w-none",
          panel === "load-previous" ? "w-199.5" : "w-90.5",
        )}
      >
        {panel && (
          <>
            <SheetTitle className="sr-only">
              {t(PANEL_TITLE_KEYS[panel])}
            </SheetTitle>
            <RegisterPanelContent panel={panel} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
