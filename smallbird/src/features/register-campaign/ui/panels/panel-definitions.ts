import { AddBrandPanel } from "./AddBrandPanel";
import { LoadPreviousPanel } from "./LoadPreviousPanel";

import type { WizardPanel } from "../../model/use-wizard-panel";
import type { ComponentType } from "react";

export interface WizardPanelDefinition {
  /** 번역 키(`features/register-campaign` namespace). */
  titleKey: "addBrand.title" | "loadPrevious.title";
  /** PC 드로어의 너비 클래스. */
  drawerWidthClassName: string;
  Content: ComponentType<{ onClose: () => void }>;
}

/** 하위 화면 정의. 하위 화면을 만들 때마다 여기에 등록함. */
export const WIZARD_PANEL_DEFINITIONS: Record<
  WizardPanel,
  WizardPanelDefinition
> = {
  "add-brand": {
    titleKey: "addBrand.title",
    drawerWidthClassName: "w-90.5",
    Content: AddBrandPanel,
  },
  "load-previous": {
    titleKey: "loadPrevious.title",
    drawerWidthClassName: "w-199.75",
    Content: LoadPreviousPanel,
  },
};
