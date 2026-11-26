import { ChevronLeft, ChevronRight } from "lucide-react";

import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import type { PendingSaveAction } from "../model/store";

export interface RegisterPreviewButtonState {
  isEnabled: boolean;
}

interface CommonBarProps {
  /** 저장을 기다리는 동작. 그 버튼은 Loading, 나머지 저장·이동 버튼은 막음. */
  pendingSave: PendingSaveAction | null;
}

interface DefaultBarProps extends CommonBarProps {
  variant: "default";
  /** 5단계 "미리보기". 없으면 그리지 않음. */
  preview: RegisterPreviewButtonState | null;
  hasPrevious: boolean;
  /** 마지막(결제) 단계면 "다음" 자리에 "결제하기"(데모는 "완료"). */
  isLastStep: boolean;
  isDemo: boolean;
  /** 결제 요청 중이면 "결제하기"를 막음(다시 누를 수 없게). */
  isPaying: boolean;
  onClickSave: () => void;
  onClickPrevious: () => void;
  onClickNext: () => void;
}

/** 반려 뒤 수정 모드: 임시저장 없이 "이전·다음"이고, 마지막(결제) 단계는 "다음" 자리에 "재승인 요청". */
interface RevisionBarProps extends CommonBarProps {
  variant: "revision";
  preview: RegisterPreviewButtonState | null;
  hasPrevious: boolean;
  isLastStep: boolean;
  /** 재승인 요청 중이면 "재승인 요청"을 막음(다시 누를 수 없게). */
  isRequesting: boolean;
  onClickPrevious: () => void;
  onClickNext: () => void;
}

type RegisterBottomBarProps = DefaultBarProps | RevisionBarProps;

function getNextLabelKey(props: RegisterBottomBarProps) {
  if (!props.isLastStep) return "action.next";
  if (props.variant === "revision") return "detail.requestReapproval";
  return props.isDemo ? "action.complete" : "action.pay";
}

// "임시저장"은 서브 헤더에 있음. 1단계는 "이전"이 없음(REQ-10-0009). "다음"·"결제하기"는 늘 활성(스펙 §3 하단 버튼).
export function RegisterBottomBar(props: RegisterBottomBarProps) {
  const { t } = useTranslation("features/register-campaign");
  const { preview } = props;
  const isDefault = props.variant === "default";
  const isBusy = isDefault ? props.isPaying : props.isRequesting;
  const isSaving = props.pendingSave !== null;
  const isNextLoading =
    props.pendingSave === "next" || props.pendingSave === "leave";
  const nextLabelKey = getNextLabelKey(props);

  return (
    <div className="flex shrink-0 gap-2 bg-background p-4 tablet:justify-end tablet:gap-3 tablet:p-5">
      {preview && (
        <Button
          variant="outline-foreground"
          className="hidden tablet:inline-flex"
          disabled={!preview.isEnabled}
        >
          {t("action.preview")}
        </Button>
      )}
      {isDefault && (
        <Button
          variant="outline-foreground"
          className="hidden tablet:inline-flex"
          isLoading={props.pendingSave === "saveDraft"}
          disabled={isSaving}
          onClick={props.onClickSave}
        >
          {t("action.saveDraft")}
        </Button>
      )}
      {props.hasPrevious && (
        <Button
          variant="outline"
          className="flex-1 tablet:flex-none"
          isLoading={props.pendingSave === "previous"}
          disabled={isSaving}
          onClick={props.onClickPrevious}
        >
          {props.pendingSave !== "previous" && <ChevronLeft aria-hidden />}
          {t("action.previous")}
        </Button>
      )}
      <Button
        className="flex-1 tablet:flex-none"
        isLoading={isNextLoading}
        disabled={isBusy || isSaving}
        aria-busy={isBusy || isNextLoading || undefined}
        onClick={props.onClickNext}
      >
        {t(nextLabelKey)}
        {nextLabelKey !== "action.complete" &&
          nextLabelKey !== "detail.requestReapproval" && (
            <ChevronRight aria-hidden />
          )}
      </Button>
    </div>
  );
}
