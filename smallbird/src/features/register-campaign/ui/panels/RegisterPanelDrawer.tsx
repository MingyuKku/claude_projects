import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";

import { useLastDefined } from "../../model/use-last-defined";
import { useRegisterPanel } from "../../model/use-register-panel";
import { RegisterPanelContent } from "./RegisterPanelContent";

import type { RegisterPanel } from "../../model/use-register-panel";

type DrawerPanel = Exclude<RegisterPanel, "terms">;

const PANEL_TITLE_KEYS = {
  brands: "brands.title",
  "add-brand": "brands.title",
  "load-previous": "loadPrevious.title",
} as const satisfies Record<DrawerPanel, string>;

export function RegisterPanelDrawer() {
  const { t } = useTranslation("features/register-campaign");
  const { panel: openedPanel, closePanel } = useRegisterPanel();
  // 약관 전문은 드로어가 아니라 가운데 다이얼로그(RegisterTermsDialog).
  const openPanel = openedPanel === "terms" ? null : openedPanel;
  // 닫는 즉시 openPanel이 null이 되므로, 슬라이드아웃이 끝날 때까지 마지막 패널의 내용과 폭을 유지함.
  const panel = useLastDefined(openPanel);

  return (
    <Sheet
      open={openPanel !== null}
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
