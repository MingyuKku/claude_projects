import { Inform } from "@/shared/components/inform";
import { MEDIA_QUERY } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib";

import { isLockedInRevision } from "../model/revision";
import { isStepStarted } from "../model/step-completion";
import { STEP_LABEL_KEYS } from "../model/step-labels";
import { useIntroGenerationNotice } from "../model/use-intro-generation";
import { useLeaveToOverview } from "../model/use-leave-to-overview";
import { usePaymentFlow } from "../model/use-payment-flow";
import { useRegisterPanel } from "../model/use-register-panel";
import { useSaveBeforeLeave } from "../model/use-save-before-leave";
import {
  useSyncCurrentStep,
  useWizardNavigation,
} from "../model/use-wizard-navigation";
import { useRegisterWizardStore } from "../model/wizard-context";
import { RegisterPanelContent } from "./panels/RegisterPanelContent";
import { RegisterPanelDrawer } from "./panels/RegisterPanelDrawer";
import { RegisterTermsDialog } from "./panels/RegisterTermsDialog";
import { PaymentDialogs } from "./PaymentDialogs";
import { RegisterBottomBar } from "./RegisterBottomBar";
import { RegisterMobileHeader } from "./RegisterMobileHeader";
import { RegisterStepBody } from "./RegisterStepBody";
import { RegisterStepNotice } from "./RegisterStepNotice";
import { RegisterWizardDialogs } from "./RegisterWizardDialogs";

import type { ReactNode } from "react";

// 마법사 본문: MO 서브 헤더 → 단계 본문(스크롤) → 하단 버튼 바. 헤더·하단 바는 고정하고 본문만 스크롤함(스펙 §3 반응형).
// 하위 화면(`?panel=`)은 PC에서 오른쪽 드로어, TAB·MO에서는 본문 자리를 바꿔 끼움.
interface RegisterWizardContentProps {
  /** 8단계 충전 입력. feature끼리 가져올 수 없어 페이지가 채움. */
  chargeSlot?: ReactNode;
}

export function RegisterWizardContent({
  chargeSlot,
}: RegisterWizardContentProps) {
  const { t } = useTranslation("features/register-campaign");
  const {
    steps,
    currentStep,
    previousStep,
    nextStep,
    goNext,
    goPrevious,
    goToStep,
    saveTemporarily,
  } = useWizardNavigation();
  const payment = usePaymentFlow(steps);
  useSyncCurrentStep();
  useSaveBeforeLeave();
  useIntroGenerationNotice(currentStep);
  const hasIntroInput = useRegisterWizardStore((state) =>
    isStepStarted("intro", state.draft),
  );
  const isRevisionMode = useRegisterWizardStore(
    (state) => state.isRevisionMode,
  );
  const isDemo = useRegisterWizardStore((state) => state.isDemo);
  const leaveToOverview = useLeaveToOverview();
  const isDesktop = useMediaQuery(MEDIA_QUERY.desktop);
  const isTabletUp = useMediaQuery(MEDIA_QUERY.tabletUp);
  const { panel } = useRegisterPanel();

  const title = t(STEP_LABEL_KEYS[currentStep]);
  const isLocked = isRevisionMode && isLockedInRevision(currentStep);
  // 미리보기 화면은 시안이 없어 버튼만 둠.
  const preview = currentStep === "intro" ? { isEnabled: hasIntroInput } : null;

  function handleClickSave() {
    void saveTemporarily();
  }

  // 1단계 패널은 TAB·MO, 약관 전문은 MO에서만 본문을 바꿔 끼움.
  const isPanelInBody =
    panel !== null && (panel === "terms" ? !isTabletUp : !isDesktop);

  if (isPanelInBody) {
    return (
      <>
        <RegisterPanelContent panel={panel} />
        <RegisterWizardDialogs />
      </>
    );
  }

  return (
    <>
      <RegisterMobileHeader
        title={title}
        preview={preview}
        onClickSave={isRevisionMode ? undefined : handleClickSave}
      />
      <div
        // 단계를 옮기면 본문 스크롤을 맨 위로 돌림.
        key={currentStep}
        className="min-h-0 flex-1 overflow-y-auto px-4 tablet:ds-p-5"
      >
        <section className="flex flex-col ds-gap-4">
          {isDemo && (
            <Inform
              variant="filled"
              items={[{ id: "demo", text: t("demo.notice") }]}
            />
          )}
          <RegisterStepNotice step={currentStep} />
          <h2 className="hidden ds-text-base-none-semibold tablet:block">
            {title}
          </h2>
          {/* 수정 모드의 잠긴 단계는 열어서 보되 입력은 모두 막음(fieldset이 안의 입력·버튼을 한꺼번에 비활성화). */}
          <fieldset disabled={isLocked} className="contents">
            <RegisterStepBody
              step={currentStep}
              chargeSlot={isRevisionMode ? undefined : chargeSlot}
            />
          </fieldset>
        </section>
      </div>
      {isRevisionMode ? (
        <RegisterBottomBar
          variant="revision"
          preview={preview}
          onClickNext={leaveToOverview}
        />
      ) : (
        <RegisterBottomBar
          variant="default"
          preview={preview}
          hasPrevious={previousStep !== null}
          isLastStep={nextStep === null}
          isDemo={isDemo}
          isPaying={payment.isPaying}
          onClickSave={handleClickSave}
          onClickPrevious={goPrevious}
          onClickNext={nextStep === null ? () => void payment.pay() : goNext}
        />
      )}
      <RegisterWizardDialogs />
      <PaymentDialogs
        dialog={payment.dialog}
        onClose={payment.closeDialog}
        onGoToStep={(step) => void goToStep(step)}
        onLeaveToDetail={payment.leaveToDetail}
        onCompleteDemo={() => void payment.completeDemo()}
        isBusy={payment.isPaying}
      />
      {isDesktop && <RegisterPanelDrawer />}
      {isTabletUp && <RegisterTermsDialog />}
    </>
  );
}
