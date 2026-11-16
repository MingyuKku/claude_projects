import { MEDIA_QUERY } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib";

import { STEP_LABEL_KEYS } from "../model/step-labels";
import { useRegisterPanel } from "../model/use-register-panel";
import { useSaveBeforeLeave } from "../model/use-save-before-leave";
import {
  useSyncCurrentStep,
  useWizardNavigation,
} from "../model/use-wizard-navigation";
import { RegisterPanelContent } from "./panels/RegisterPanelContent";
import { RegisterPanelDrawer } from "./panels/RegisterPanelDrawer";
import { RegisterBottomBar } from "./RegisterBottomBar";
import { RegisterMobileHeader } from "./RegisterMobileHeader";
import { RegisterStepBody } from "./RegisterStepBody";
import { RegisterStepNotice } from "./RegisterStepNotice";
import { RegisterWizardDialogs } from "./RegisterWizardDialogs";

// 마법사 본문: MO 서브 헤더 → 단계 본문(스크롤) → 하단 버튼 바. 헤더·하단 바는 고정하고 본문만 스크롤함(스펙 §3 반응형).
// 하위 화면(`?panel=`)은 PC에서 오른쪽 드로어, TAB·MO에서는 본문 자리를 바꿔 끼움.
export function RegisterWizardContent() {
  const { t } = useTranslation("features/register-campaign");
  const {
    currentStep,
    previousStep,
    nextStep,
    goNext,
    goPrevious,
    saveTemporarily,
  } = useWizardNavigation();
  useSyncCurrentStep();
  useSaveBeforeLeave();
  const isDesktop = useMediaQuery(MEDIA_QUERY.desktop);
  const { panel } = useRegisterPanel();

  const title = t(STEP_LABEL_KEYS[currentStep]);

  function handleClickSave() {
    void saveTemporarily();
  }

  if (panel && !isDesktop) {
    return (
      <>
        <RegisterPanelContent panel={panel} />
        <RegisterWizardDialogs />
      </>
    );
  }

  return (
    <>
      <RegisterMobileHeader title={title} onClickSave={handleClickSave} />
      <div
        // 단계를 옮기면 본문 스크롤을 맨 위로 돌림.
        key={currentStep}
        className="min-h-0 flex-1 overflow-y-auto px-4 tablet:ds-p-5"
      >
        <section className="flex flex-col ds-gap-4">
          <RegisterStepNotice step={currentStep} />
          <h2 className="hidden ds-text-base-none-semibold tablet:block">
            {title}
          </h2>
          <RegisterStepBody step={currentStep} />
        </section>
      </div>
      <RegisterBottomBar
        hasPrevious={previousStep !== null}
        isLastStep={nextStep === null}
        onClickSave={handleClickSave}
        onClickPrevious={goPrevious}
        onClickNext={goNext}
      />
      <RegisterWizardDialogs />
      {isDesktop && <RegisterPanelDrawer />}
    </>
  );
}
