import { useEffect, useState } from "react";

import { useTranslation } from "@/shared/i18n";

import { isSectionLockedInEdit } from "../model/edit-mode";
import { CampaignRegisterSlotsContext } from "../model/slots-context";
import { useCampaignRegisterStore } from "../model/store-context";
import { useCampaignPayment } from "../model/use-campaign-payment";
import { useCampaignSave } from "../model/use-campaign-save";
import { useCurrentStep } from "../model/use-current-step";
import { useIntroGenerationWatcher } from "../model/use-intro-generation";
import { useStepNavigation } from "../model/use-step-navigation";
import { useWizardPanel } from "../model/use-wizard-panel";
import { CampaignStepDrawer } from "./CampaignStepDrawer";
import { CampaignWizardFooter } from "./CampaignWizardFooter";
import { CampaignWizardHeader } from "./CampaignWizardHeader";
import { EditLockedFieldset } from "./EditLockedFieldset";
import { EditLockNotice } from "./EditLockNotice";
import { IncompleteStepsAlert } from "./IncompleteStepsAlert";
import { WIZARD_PANEL_DEFINITIONS } from "./panels/panel-definitions";
import { WizardPanelFrame } from "./panels/WizardPanelFrame";
import { PaymentResultAlert } from "./PaymentResultAlert";
import { SaveBlockedAlert } from "./SaveBlockedAlert";
import { STEP_BODIES, STEP_NOTICES } from "./step-bodies";

import type { ReactNode } from "react";

interface CampaignRegisterWizardProps {
  /** 8단계 결제 수단 카드 안에 놓는 충전 영역. feature끼리 가져올 수 없어 페이지가 채움. */
  chargeSlot?: ReactNode;
  /** 모든 필수 단계를 마친 상태에서 "결제하기"를 눌렀을 때. */
  onPay?: () => void | Promise<void>;
}

// 마법사 본문: 모바일 서브 헤더 + 단계 제목 + 단계 화면 + 하단 버튼 + 필수 항목 미입력 알럿.
// 헤더·하단 버튼은 고정하고 본문만 스크롤하므로 부모가 높이를 채워 줘야 함(`FocusShell`의 main을 `flex flex-col`로 둠).
export function CampaignRegisterWizard({
  chargeSlot,
  onPay,
}: CampaignRegisterWizardProps) {
  const { t } = useTranslation("features/register-campaign");
  const { slug, step } = useCurrentStep();
  const markVisited = useCampaignRegisterStore((state) => state.markVisited);
  const { saveDraft } = useCampaignSave();
  // 모든 단계 검사를 통과한 "결제하기"의 처리. `onPay`를 넘기면 그것을 대신 씀(테스트·다른 흐름).
  const payment = useCampaignPayment();
  const navigation = useStepNavigation({ onPay: onPay ?? payment.pay });
  // AI 생성은 다른 단계로 이동해도 이어서 기다려야 해서 단계 화면이 아니라 마법사에서 확인함.
  useIntroGenerationWatcher(slug);
  const { panel, closePanel, isDrawer } = useWizardPanel();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const StepBody = STEP_BODIES[slug];
  const StepNotice = STEP_NOTICES[slug];
  const title = step ? t(step.titleKey) : "";
  // 5단계에만 "미리보기"가 있고, 내용이 하나도 없으면 비활성임(스펙 §3 5단계).
  const hasIntroContent = useCampaignRegisterStore((state) => {
    const { intro } = state.draft;
    return (
      intro.mainImage !== null ||
      intro.media.length > 0 ||
      Boolean(intro.description) ||
      Boolean(intro.notice) ||
      intro.hashtags.length > 0
    );
  });
  const preview =
    slug === "intro" && !navigation.isEditMode
      ? { isDisabled: !hasIntroContent }
      : undefined;
  // 수정 모드에서 잠긴 단계(4·7·8)는 읽기 전용으로 열고 안내를 붙임. 6단계는 인원·리워드 칸만 잠그므로 단계 화면이 직접 함.
  const isLockedStep =
    navigation.isEditMode &&
    step !== undefined &&
    isSectionLockedInEdit(step.section);

  // 단계를 열면 가 본 단계로 남김(사이드바의 완료·경고 표시가 씀).
  useEffect(() => {
    if (step) markVisited(step.section);
  }, [step, markVisited]);

  const panelDefinition = panel ? WIZARD_PANEL_DEFINITIONS[panel] : null;
  const panelFrame = panelDefinition && (
    <WizardPanelFrame
      title={t(panelDefinition.titleKey)}
      drawerWidthClassName={panelDefinition.drawerWidthClassName}
      isDrawer={isDrawer}
      onClose={closePanel}
    >
      <panelDefinition.Content onClose={closePanel} />
    </WizardPanelFrame>
  );

  // TAB·MO는 하위 화면이 본문을 통째로 대체함(서브 헤더·단계 화면·하단 버튼 모두).
  if (panelFrame && !isDrawer) return panelFrame;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CampaignWizardHeader
        title={title}
        preview={preview}
        onClickMenu={() => setIsDrawerOpen(true)}
        onClickSaveDraft={
          navigation.isEditMode ? undefined : () => void saveDraft()
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 tablet:p-5">
        {StepNotice && (
          <div className="mb-4 empty:hidden tablet:mb-6">
            <StepNotice />
          </div>
        )}
        {isLockedStep && (
          <EditLockNotice
            kind={step?.slug === "add-ons" ? "amount" : "done"}
            className="mb-4"
          />
        )}
        <h2 className="mb-4 hidden text-base leading-none font-semibold text-foreground tablet:block">
          {title}
        </h2>
        {StepBody && (
          <CampaignRegisterSlotsContext value={{ chargeSlot }}>
            <EditLockedFieldset isLocked={isLockedStep}>
              <StepBody />
            </EditLockedFieldset>
          </CampaignRegisterSlotsContext>
        )}
      </div>
      <CampaignWizardFooter
        preview={preview}
        isEditMode={navigation.isEditMode}
        isFirst={navigation.isFirst}
        isLast={navigation.isLast}
        onClickSaveDraft={() => void saveDraft()}
        onClickPrevious={() => void navigation.handleClickPrevious()}
        onClickNext={() => void navigation.handleClickNext()}
        onClickPay={() => void navigation.handleClickPay()}
      />
      <CampaignStepDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
      {panelFrame}
      <SaveBlockedAlert />
      <PaymentResultAlert alert={payment.alert} onClose={payment.closeAlert} />
      <IncompleteStepsAlert
        alert={navigation.alert}
        onClose={navigation.closeAlert}
        onConfirm={() => void navigation.handleConfirmAlert()}
      />
    </div>
  );
}
