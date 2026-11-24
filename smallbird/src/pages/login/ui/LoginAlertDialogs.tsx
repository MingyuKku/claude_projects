import { Trans, useTranslation } from "@/shared/i18n";
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

interface LoginAlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/** 승인 검토중인 계정이 로그인했을 때의 안내. 취소·확인 모두 닫기만 함. */
export function LockedAlertDialog({ isOpen, onClose }: LoginAlertDialogProps) {
  const { t } = useTranslation("pages/login");
  const { t: tCommon } = useTranslation();

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("locked.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            <Trans t={t} i18nKey="locked.message" components={{ br: <br /> }} />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("action.cancel")}</AlertDialogCancel>
          <AlertDialogAction>{tCommon("action.confirm")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** 크리에이터 탭의 동작을 눌렀을 때의 안내. 서버를 부르지 않음. */
export function ComingSoonAlertDialog({
  isOpen,
  onClose,
}: LoginAlertDialogProps) {
  const { t } = useTranslation("pages/login");
  const { t: tCommon } = useTranslation();

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("comingSoon.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {tCommon("status.comingSoon")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>{tCommon("action.confirm")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
