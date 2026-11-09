import { useTranslation } from "@/shared/i18n";

import { getStepIndicators } from "../lib/step-indicators";
import { useIsEditMode } from "./edit-mode";
import { useCampaignRegisterStore } from "./store-context";
import { useCurrentStep } from "./use-current-step";
import { useFinishEdit } from "./use-finish-edit";
import { useMoveToStep } from "./use-step-navigation";

import type { StepSidebarItem } from "@/shared/components/step-sidebar";

/** 수정 모드 사이드바 맨 위 "기본정보" 항목의 id. */
export const SUMMARY_ID = "summary";

/** 사이드바(PC·TAB)와 모바일 드로어가 함께 쓰는 항목. 완료·경고 표시는 초안 값을 단계 스키마로 매번 검사해 정함. */
export function useStepSidebarItems() {
  const { t } = useTranslation("features/register-campaign");
  const draft = useCampaignRegisterStore((state) => state.draft);
  const { slug, steps } = useCurrentStep();
  const { moveToStep } = useMoveToStep();
  const isEditMode = useIsEditMode();
  const { finishEdit } = useFinishEdit();

  const indicators = getStepIndicators(steps, draft, slug);
  const items: StepSidebarItem[] = steps.map((step, index) => {
    const indicator = indicators[index];
    // 생성 중인 5단계는 비어 있어도 경고하지 않고 로딩 표시를 보임.
    const isBusy =
      step.slug === "intro" && draft.intro.aiJob?.status === "PENDING";
    // 수정 모드에서는 8단계가 모두 완료 표시이고 현재 단계만 포커스 링임(스펙 §3 단계 사이드바).
    if (isEditMode) {
      return {
        id: step.slug,
        label: t(step.titleKey),
        number: index + 1,
        state: step.slug === slug ? ("current" as const) : ("done" as const),
      };
    }
    return {
      id: step.slug,
      label: t(step.titleKey),
      number: index + 1,
      state: indicator?.state ?? "unvisited",
      hasAlert: !isBusy && indicator?.hasAlert,
      alertLabel:
        !isBusy && indicator?.hasAlert ? t("incomplete.title") : undefined,
      isBusy,
      busyLabel: isBusy ? t("intro.ai.sidebarBusy") : undefined,
    };
  });

  // 수정 모드에서는 맨 위에 "기본정보"가 붙고, 누르면 저장한 뒤 등록 내역으로 돌아감.
  const header = isEditMode
    ? { id: SUMMARY_ID, label: t("sidebar.summary"), isCurrent: false }
    : undefined;

  return { items, moveToStep, header, finishEdit };
}
