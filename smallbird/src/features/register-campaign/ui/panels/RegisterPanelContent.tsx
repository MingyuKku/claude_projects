import { AddBrandPanel } from "./AddBrandPanel";
import { BrandManagePanel } from "./BrandManagePanel";
import { LoadPreviousPanel } from "./LoadPreviousPanel";

import type { RegisterPanel } from "../../model/use-register-panel";

interface RegisterPanelContentProps {
  panel: RegisterPanel;
}

export function RegisterPanelContent({ panel }: RegisterPanelContentProps) {
  switch (panel) {
    case "brands":
      return <BrandManagePanel />;
    case "add-brand":
      return <AddBrandPanel />;
    case "load-previous":
      return <LoadPreviousPanel />;
  }
}
