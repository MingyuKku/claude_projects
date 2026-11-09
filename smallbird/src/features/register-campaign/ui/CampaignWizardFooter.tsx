import { ChevronLeft, ChevronRight } from "lucide-react";

import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

const BUTTON_HEIGHT_CLASS = "h-9.5 desktop:h-10";

interface CampaignWizardFooterProps {
  /** 5단계의 "미리보기": 보이는 단계에서 넘기고, 내용이 없으면 비활성. 미리보기 화면은 시안이 없어 동작은 없음(스펙 D-8). */
  preview?: { isDisabled: boolean };
  /** 반려 후 수정 모드: "다음"만 두고 누르면 저장한 뒤 등록 내역으로 돌아감. */
  isEditMode?: boolean;
  isFirst: boolean;
  isLast: boolean;
  onClickSaveDraft: () => void;
  onClickPrevious: () => void;
  onClickNext: () => void;
  onClickPay: () => void;
}

// 하단 버튼(Figma Button 7555:333674 PC·TAB, 7555:414186 MO). "다음"·"결제하기"는 늘 활성이고 누르면 검사함.
// 버튼 높이는 시안이 TAB·MO 38px, PC(≥1440) 40px임(TAB 78·MO 70·PC 80px 바).
// PC·TAB: 오른쪽 정렬 "임시저장 · < 이전 · 다음 >"(1단계는 "임시저장 · 다음"). MO: 임시저장이 서브 헤더로 가고 전체 폭,
// 1단계는 "다음"만, 2단계부터는 "이전"·"다음" 반반.
export function CampaignWizardFooter({
  preview,
  isEditMode = false,
  isFirst,
  isLast,
  onClickSaveDraft,
  onClickPrevious,
  onClickNext,
  onClickPay,
}: CampaignWizardFooterProps) {
  const { t } = useTranslation("features/register-campaign");

  return (
    <div className="flex shrink-0 items-center gap-3 p-4 tablet:justify-end tablet:p-5">
      {!isEditMode && preview && (
        <Button
          variant="outline-foreground"
          className={cn(BUTTON_HEIGHT_CLASS, "hidden tablet:inline-flex")}
          disabled={preview.isDisabled}
        >
          {t("footer.preview")}
        </Button>
      )}
      {!isEditMode && (
        <Button
          variant="outline-foreground"
          className={cn(BUTTON_HEIGHT_CLASS, "hidden tablet:inline-flex")}
          onClick={onClickSaveDraft}
        >
          {t("footer.saveDraft")}
        </Button>
      )}
      {!isFirst && !isEditMode && (
        <Button
          variant="outline"
          className={cn(BUTTON_HEIGHT_CLASS, "flex-1 tablet:flex-none")}
          onClick={onClickPrevious}
        >
          <ChevronLeft />
          {t("footer.prev")}
        </Button>
      )}
      <Button
        className={cn(BUTTON_HEIGHT_CLASS, "flex-1 tablet:flex-none")}
        onClick={isLast && !isEditMode ? onClickPay : onClickNext}
      >
        {isLast && !isEditMode ? t("footer.pay") : t("footer.next")}
        <ChevronRight />
      </Button>
    </div>
  );
}
