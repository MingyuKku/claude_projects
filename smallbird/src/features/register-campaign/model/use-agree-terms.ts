import { useRegisterPanel } from "./use-register-panel";
import { useRegisterWizardStore } from "./wizard-context";

export function useAgreeTerms() {
  const { termsKind, closePanel } = useRegisterPanel();
  const patchStepDraft = useRegisterWizardStore(
    (state) => state.patchStepDraft,
  );

  return function agreeTerms() {
    if (termsKind) patchStepDraft("policy", { [termsKind]: true });
    closePanel();
  };
}
