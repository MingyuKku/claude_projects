import { ChevronLeft, ChevronRight } from "lucide-react";

import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

interface RegisterBottomBarProps {
  hasPrevious: boolean;
  /** 마지막(결제) 단계면 "다음" 자리에 "결제하기". */
  isLastStep: boolean;
  onClickSave: () => void;
  onClickPrevious: () => void;
  onClickNext: () => void;
}

// 하단 버튼 바. PC·TAB은 오른쪽 정렬 "임시저장 · < 이전 · 다음 >"(간격 12), MO는 전체 폭에 "이전"·"다음" 반반(간격 8)이고
// "임시저장"은 서브 헤더에 있음. 1단계는 "이전"이 없음(REQ-10-0009). "다음"·"결제하기"는 늘 활성(스펙 §3 하단 버튼).
export function RegisterBottomBar({
  hasPrevious,
  isLastStep,
  onClickSave,
  onClickPrevious,
  onClickNext,
}: RegisterBottomBarProps) {
  const { t } = useTranslation("features/register-campaign");

  return (
    <div className="flex shrink-0 gap-2 bg-background p-4 tablet:justify-end tablet:gap-3 tablet:p-5">
      <Button
        variant="outline-foreground"
        className="hidden tablet:inline-flex"
        onClick={onClickSave}
      >
        {t("action.saveDraft")}
      </Button>
      {hasPrevious && (
        <Button
          variant="outline"
          className="flex-1 tablet:flex-none"
          onClick={onClickPrevious}
        >
          <ChevronLeft aria-hidden />
          {t("action.previous")}
        </Button>
      )}
      <Button className="flex-1 tablet:flex-none" onClick={onClickNext}>
        {t(isLastStep ? "action.pay" : "action.next")}
        <ChevronRight aria-hidden />
      </Button>
    </div>
  );
}
