import { createContext, use } from "react";
import { useStore } from "zustand";

import type { DraftSaver } from "./draft-saver";
import type { RegisterWizardStore, RegisterWizardStoreApi } from "./store";

export interface RegisterWizardContextValue {
  store: RegisterWizardStoreApi;
  saver: DraftSaver;
}

export const RegisterWizardContext =
  createContext<RegisterWizardContextValue | null>(null);

function useWizardContext() {
  const value = use(RegisterWizardContext);
  if (!value) {
    throw new Error(
      "register wizard hooks must be used inside RegisterWizardProvider",
    );
  }
  return value;
}

export function useRegisterWizardStore<T>(
  selector: (state: RegisterWizardStore) => T,
): T {
  return useStore(useWizardContext().store, selector);
}

export function useRegisterWizardStoreApi() {
  return useWizardContext().store;
}

export function useDraftSaver() {
  return useWizardContext().saver;
}
