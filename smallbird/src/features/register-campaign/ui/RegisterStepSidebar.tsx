import { ScrollPanel } from "@/shared/components/scroll-panel";

import { RegisterStepNav } from "./RegisterStepNav";

// PC·TAB 사이드바(Figma `Sidebar / Sub`, 222 × 전체 높이). 셸의 LNB 자리에 들어감.
export function RegisterStepSidebar() {
  return (
    <ScrollPanel
      className="h-full border-r bg-muted/40"
      contentClassName="px-4 py-5"
    >
      <RegisterStepNav size="md" />
    </ScrollPanel>
  );
}
