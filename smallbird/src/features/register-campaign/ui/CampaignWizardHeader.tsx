import { Menu } from "lucide-react";

import { SubHeader } from "@/shared/components/app-header";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

interface CampaignWizardHeaderProps {
  title: string;
  onClickMenu: () => void;
  /** 5단계의 "미리보기"(MO는 서브 헤더에 있음). 없으면 그리지 않음. */
  preview?: { isDisabled: boolean };
  /** 없으면(수정 모드) 임시저장을 그리지 않음. */
  onClickSaveDraft?: () => void;
}

// 모바일 서브 헤더(Figma Header / Sub / Mobile 7555:427144): "≡" + 단계 제목 + "임시저장". 임시저장이 하단 바에서 여기로 옮겨 옴.
export function CampaignWizardHeader({
  title,
  onClickMenu,
  preview,
  onClickSaveDraft,
}: CampaignWizardHeaderProps) {
  const { t } = useTranslation("features/register-campaign");

  return (
    <SubHeader
      variant="list"
      className="shrink-0 tablet:hidden"
      title={
        <>
          <Button
            variant="outline-foreground"
            size="icon-sm"
            aria-label={t("sidebar.open")}
            onClick={onClickMenu}
          >
            <Menu />
          </Button>
          <span className="ml-2">{title}</span>
        </>
      }
      actions={
        (preview || onClickSaveDraft) && (
          <div className="flex items-center gap-2">
            {preview && (
              <Button
                variant="outline-foreground"
                size="sm"
                disabled={preview.isDisabled}
              >
                {t("footer.preview")}
              </Button>
            )}
            {onClickSaveDraft && (
              <Button
                variant="outline-foreground"
                size="sm"
                onClick={onClickSaveDraft}
              >
                {t("footer.saveDraft")}
              </Button>
            )}
          </div>
        )
      }
    />
  );
}
