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

import type { SocialProvider } from "@/entities/account";

interface UnlinkSocialDialogProps {
  /** 해제를 확인받는 SNS. null이면 닫혀 있음. */
  provider: SocialProvider | null;
  onCancel: () => void;
  onConfirm: (provider: SocialProvider) => void;
}

// 해제 확인 알럿. 시안에 없는 화면이라 삭제 알럿과 같은 구조·문구는 스펙 §6(사용자 결정).
export function UnlinkSocialDialog({
  provider,
  onCancel,
  onConfirm,
}: UnlinkSocialDialogProps) {
  const { t } = useTranslation("features/link-social-account");
  const { t: tCommon } = useTranslation();
  const providerName = provider ? t(`provider.${provider}`) : "";

  return (
    <AlertDialog
      open={provider !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent className="p-6">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("unlink.title")}</AlertDialogTitle>
          <AlertDialogDescription className="leading-6">
            {t("unlink.description", { provider: providerName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline-foreground">
            {tCommon("action.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            destructive
            onClick={() => provider && onConfirm(provider)}
          >
            {t("unlink.action")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
