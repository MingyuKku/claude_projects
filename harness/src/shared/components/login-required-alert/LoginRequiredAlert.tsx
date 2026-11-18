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

interface LoginRequiredAlertProps {
  open: boolean;
  onCancel: () => void;
  onLogin: () => void;
}

// 비로그인이 로그인이 필요한 메뉴·카드를 눌렀을 때 띄우는 안내 알럿(Figma Alert Dialog 10132:97915, specs/main.md "비로그인 정책").
// 문구는 모든 화면이 같아 common에서 가져옴.
export function LoginRequiredAlert({
  open,
  onCancel,
  onLogin,
}: LoginRequiredAlertProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("loginRequired.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("loginRequired.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onLogin}>
            {t("loginRequired.action")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
