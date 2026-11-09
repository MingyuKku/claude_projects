import { useTranslation } from "@/shared/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

interface CampaignTypeChangeAlertProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

// 캠페인 유형을 바꾸면 2단계 입력과 6단계의 유형 전용 값이 비워지므로, 그런 값이 있을 때만 확인함(문구는 스펙 §6, Figma에 없음).
export function CampaignTypeChangeAlert({
  open,
  onCancel,
  onConfirm,
}: CampaignTypeChangeAlertProps) {
  const { t } = useTranslation("features/register-campaign");
  const { t: tCommon } = useTranslation();

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("campaignInfo.typeChange.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("campaignInfo.typeChange.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("action.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {t("campaignInfo.typeChange.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
