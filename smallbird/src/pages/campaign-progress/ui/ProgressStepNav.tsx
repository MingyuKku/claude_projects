import { useNavigate } from "react-router";

import { getCampaignProgressPath } from "@/entities/campaign";
import { StepSidebar } from "@/shared/components/step-sidebar";
import { useTranslation } from "@/shared/i18n";

import { getProgressMenuSteps } from "../model/steps";

import type { CampaignDetail, CampaignProgressStep } from "@/entities/campaign";

const OVERVIEW_ID = "overview";
const RESULT_ID = "result";

interface ProgressStepNavProps {
  detail: CampaignDetail;
  /** 없으면 기본정보. */
  currentStep: CampaignProgressStep | null;
  size: "md" | "sm";
  /** 단계를 고른 뒤(모바일 드로어 닫기). */
  onSelected?: () => void;
  className?: string;
}

// 맨 위 기본정보 + 번호 단계(잠금 없음). 종료되면 맨 아래 캠페인 결과(시안 13288:433441). 종료 뒤에도 모든 단계 조회(REQ-14-0010),
// 단계 안의 동작 제한은 각 단계 화면이 맡음. 진행 중 결과 진입(완료 승인 1건 이상)은 결과 단계를 만들 때 붙임.
// 완료 체크·느낌표는 아직 단계 응답이 없어 그리지 않음(스펙 §3 느낌표).
export function ProgressStepNav({
  detail,
  currentStep,
  size,
  onSelected,
  className,
}: ProgressStepNavProps) {
  const { t } = useTranslation("pages/campaign-progress");
  const navigate = useNavigate();
  const isEnded = detail.stage === "ENDED";
  const steps = getProgressMenuSteps(detail);

  function handleSelect(id: string) {
    onSelected?.();
    const step =
      steps.find((item) => item === id) ??
      (id === RESULT_ID ? RESULT_ID : undefined);
    // 단계 사이 이동은 기록을 쌓지 않아 헤더 "<"가 들어온 화면(현황)으로 한 번에 돌아감.
    void navigate(getCampaignProgressPath(detail.campaignIdx, step), {
      replace: true,
    });
  }

  return (
    <StepSidebar
      label={t("nav.label")}
      size={size}
      className={className}
      // 진행 단계에는 입력 중·미입력 표시가 없음.
      indicatorLabels={{ editing: "", warning: "" }}
      overviewItem={{
        id: OVERVIEW_ID,
        label: t("step.overview"),
        isCurrent: currentStep === null,
      }}
      items={steps.map((step, index) => ({
        id: step,
        number: index + 1,
        label: t(`step.${step}`),
        state: step === currentStep ? "current" : "default",
      }))}
      footerItem={
        isEnded
          ? {
              id: RESULT_ID,
              label: t("step.result"),
              isCurrent: currentStep === RESULT_ID,
            }
          : undefined
      }
      onSelect={handleSelect}
    />
  );
}
