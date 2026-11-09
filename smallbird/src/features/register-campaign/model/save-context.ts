import { createContext, use } from "react";

import type { AutosaveController } from "./autosave";

export const CampaignRegisterSaveContext =
  createContext<AutosaveController | null>(null);

export function useAutosaveController() {
  const controller = use(CampaignRegisterSaveContext);
  if (!controller) {
    throw new Error(
      "useCampaignSave must be used inside CampaignRegisterProvider",
    );
  }
  return controller;
}
