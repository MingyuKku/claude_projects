import { useTranslation } from "@/shared/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

interface RealtimeHoursAlertProps {
  open: boolean;
  onClose: () => void;
}

// 운영 시간 밖에서 실시간 상담하기를 눌렀을 때(REQ-23-0020 문구). Figma 시안이 없어 기존 Alert 모양을 씀.
export function RealtimeHoursAlert({ open, onClose }: RealtimeHoursAlertProps) {
  const { t } = useTranslation("features/realtime-consultation");
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("hours.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("hours.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>
            {t("idle.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
