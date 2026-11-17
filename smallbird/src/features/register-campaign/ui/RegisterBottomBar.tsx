import { ChevronLeft, ChevronRight } from "lucide-react";

import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

export interface RegisterPreviewButtonState {
  isEnabled: boolean;
}

interface DefaultBarProps {
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

/** 반려 뒤 수정 모드: "다음" 하나(저장 후 등록 내역으로). */
interface RevisionBarProps {
  variant: "revision";
  preview: RegisterPreviewButtonState | null;
  onClickNext: () => void;
}

type RegisterBottomBarProps = DefaultBarProps | RevisionBarProps;

function getNextLabelKey(props: RegisterBottomBarProps) {
  if (props.variant === "revision" || !props.isLastStep) return "action.next";
  return props.isDemo ? "action.complete" : "action.pay";
}

// "임시저장"은 서브 헤더에 있음. 1단계는 "이전"이 없음(REQ-10-0009). "다음"·"결제하기"는 늘 활성(스펙 §3 하단 버튼).
export function RegisterBottomBar(props: RegisterBottomBarProps) {
  const { t } = useTranslation("features/register-campaign");
  const { preview } = props;
  const isDefault = props.variant === "default";

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
          onClick={props.onClickSave}
        >
          {t("action.saveDraft")}
        </Button>
      )}
      {isDefault && props.hasPrevious && (
        <Button
          variant="outline"
          className="flex-1 tablet:flex-none"
          onClick={props.onClickPrevious}
        >
          <ChevronLeft aria-hidden />
          {t("action.previous")}
        </Button>
      )}
      <Button
        className="flex-1 tablet:flex-none"
        disabled={isDefault && props.isPaying}
        aria-busy={(isDefault && props.isPaying) || undefined}
        onClick={props.onClickNext}
      >
        {t(getNextLabelKey(props))}
        <ChevronRight aria-hidden />
      </Button>
    </div>
  );
}
