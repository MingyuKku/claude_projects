import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

interface WithdrawActionsProps {
  onClickCancel: () => void;
  onClickAgree: () => void;
  className?: string;
}

// 시안 하단 버튼 한 쌍: "취소"(outline) · "동의 및 탈퇴하기"(destructive), 같은 폭.
export function WithdrawActions({
  onClickCancel,
  onClickAgree,
  className,
}: WithdrawActionsProps) {
  const { t } = useTranslation("features/withdraw-account");
  const { t: tCommon } = useTranslation();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant="outline-foreground"
        className="flex-1"
        onClick={onClickCancel}
      >
        {tCommon("action.cancel")}
      </Button>
      <Button
        type="button"
        destructive
        className="flex-1"
        onClick={onClickAgree}
      >
        {t("agree")}
      </Button>
    </div>
  );
}
