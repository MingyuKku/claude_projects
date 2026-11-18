import { Info } from "lucide-react";
import { useNavigate } from "react-router";

import { ROUTES } from "@/shared/config";
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
import { Button } from "@/shared/ui/button";

import { useDemoConversion } from "../../model/use-demo-conversion";

interface DemoNoticeProps {
  campaignIdx: number;
  /** PICK형 구독 여부. 아직 모르면 null(버튼을 그리지 않음). */
  isSubscribed: boolean | null;
  canManage: boolean;
}

export function DemoNotice({
  campaignIdx,
  isSubscribed,
  canManage,
}: DemoNoticeProps) {
  const { t } = useTranslation("features/register-campaign");
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const conversion = useDemoConversion(campaignIdx);

  return (
    <div className="flex flex-wrap items-end justify-end gap-3 rounded-lg border bg-background ds-p-6">
      <div className="flex min-w-65.5 flex-1 flex-col gap-2">
        <p className="flex items-center gap-2 ds-text-lg-7-semibold text-primary ko:break-keep">
          <Info aria-hidden className="size-5 shrink-0" />
          {t("demo.detail.title")}
        </p>
        {isSubscribed !== null && (
          <p className="ds-text-sm-5-normal ko:break-keep">
            {t(
              isSubscribed
                ? "demo.detail.subscribedDescription"
                : "demo.detail.unsubscribedDescription",
            )}
          </p>
        )}
      </div>
      {canManage && isSubscribed === false && (
        <Button onClick={() => void navigate(ROUTES.mypageSubscribe)}>
          {t("demo.detail.subscribe")}
        </Button>
      )}
      {canManage && isSubscribed === true && (
        <Button
          disabled={conversion.isConverting}
          onClick={conversion.openConfirm}
        >
          {t("demo.detail.convert")}
        </Button>
      )}
      <AlertDialog
        open={conversion.isConfirmOpen}
        onOpenChange={(isOpen) => !isOpen && conversion.closeConfirm()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("demo.dialog.convert.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("demo.dialog.convert.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("action.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={conversion.isConverting}
              onClick={(event) => {
                // 전환하는 동안 알럿을 열어 두고, 끝나면 닫음.
                event.preventDefault();
                void conversion.convert();
              }}
            >
              {t("demo.dialog.convert.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
