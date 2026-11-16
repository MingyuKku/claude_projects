import { StepSidebar } from "@/shared/components/step-sidebar";
import { useTranslation } from "@/shared/i18n";

import { STEP_LABEL_KEYS } from "../model/step-labels";
import { getStepStatuses } from "../model/step-status";
import { useWizardNavigation } from "../model/use-wizard-navigation";
import { useRegisterWizardStore } from "../model/wizard-context";

interface RegisterStepNavProps {
  size: "md" | "sm";
  /** 단계를 고른 뒤(모바일 드로어 닫기 등). */
  onSelected?: () => void;
  className?: string;
}

// 단계 목록. PC·TAB 사이드바(md)와 MO 드로어(sm)가 함께 씀. 단계를 고르면 저장한 뒤 이동함.
export function RegisterStepNav({
  size,
  onSelected,
  className,
}: RegisterStepNavProps) {
  const { t } = useTranslation("features/register-campaign");
  const { steps, currentStep, goToStep } = useWizardNavigation();
  const draft = useRegisterWizardStore((state) => state.draft);
  const hasVisitedPayment = useRegisterWizardStore(
    (state) => state.hasVisitedPayment,
  );
  const statuses = getStepStatuses({
    steps,
    draft,
    currentStep,
    hasVisitedPayment,
  });

  function handleSelect(id: string) {
    const target = steps.find(({ step }) => step === id)?.step;
    onSelected?.();
    if (target && target !== currentStep) void goToStep(target);
  }

  return (
    <StepSidebar
      label={t("nav.label")}
      size={size}
      className={className}
      indicatorLabels={{
        editing: t("nav.indicator.editing"),
        warning: t("nav.indicator.warning"),
      }}
      items={statuses.map((status, index) => ({
        id: status.step,
        number: index + 1,
        label: t(STEP_LABEL_KEYS[status.step]),
        state: status.state,
        indicator: status.indicator,
      }))}
      onSelect={handleSelect}
    />
  );
}
