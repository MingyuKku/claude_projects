import { X } from "lucide-react";

import { SubHeader } from "@/shared/components/app-header";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { WithdrawActions } from "./WithdrawActions";
import { WithdrawTermsBox } from "./WithdrawTermsBox";

interface WithdrawTermsScreenProps {
  onClose: () => void;
  onAgree: () => void;
}

// 레이아웃 여백(--mypage-gutter)만큼 나가 가장자리까지 채우고, 화면 높이에서 멈춰 약관 박스 안쪽만 스크롤함(페이지는 스크롤하지 않음).
export function WithdrawTermsScreen({
  onClose,
  onAgree,
}: WithdrawTermsScreenProps) {
  const { t } = useTranslation("features/withdraw-account");
  const { t: tCommon } = useTranslation();

  return (
    <div className="-mx-(--mypage-gutter) flex h-full flex-col">
      <SubHeader
        className="shrink-0"
        title={<h1>{t("title")}</h1>}
        actions={
          <Button
            type="button"
            variant="ghost-foreground"
            size="icon"
            aria-label={tCommon("action.close")}
            onClick={onClose}
          >
            <X />
          </Button>
        }
      />
      <div className="flex min-h-0 flex-1 flex-col p-4 pb-0">
        <WithdrawTermsBox className="min-h-0 flex-1" />
      </div>
      <WithdrawActions
        className="shrink-0 bg-background p-4"
        onClickCancel={onClose}
        onClickAgree={onAgree}
      />
    </div>
  );
}
