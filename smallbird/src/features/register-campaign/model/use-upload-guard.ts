import { useEffect } from "react";
import { toast } from "sonner";

import { useTranslation } from "@/shared/i18n";

import { useRegisterWizardStore } from "./wizard-context";

const UPLOAD_TOAST_ID = "register-campaign-upload";

/**
 * 5단계 파일을 올리는 동안 진행("n/m")을 토스트로 알리고, 탭 닫기·새로고침 때 브라우저가 확인을 묻게 함.
 * 앱 안 이동은 저장이 끝나야 나가므로(useSaveBeforeLeave) 막지 않아도 됨. 마법사가 열려 있는 동안 늘 마운트된 곳에서 부름.
 */
export function useUploadGuard() {
  const { t } = useTranslation("features/register-campaign");
  const progress = useRegisterWizardStore((state) => state.uploadProgress);
  const isUploading = progress !== null;
  const done = progress?.done;
  const total = progress?.total;

  useEffect(() => {
    if (!isUploading) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) =>
      event.preventDefault();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      toast.dismiss(UPLOAD_TOAST_ID);
    };
  }, [isUploading]);

  useEffect(() => {
    if (done === undefined || total === undefined) return;
    toast.loading(t("toast.uploading", { done, total }), {
      id: UPLOAD_TOAST_ID,
    });
  }, [done, total, t]);
}
