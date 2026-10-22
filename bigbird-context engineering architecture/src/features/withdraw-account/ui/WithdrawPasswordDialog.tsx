import { X } from "lucide-react";

import { SubHeader } from "@/shared/components/app-header";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";

import { WithdrawPasswordForm } from "./WithdrawPasswordForm";

import type { useWithdrawalForm } from "../lib/use-withdrawal-form";

interface WithdrawPasswordDialogProps {
  form: ReturnType<typeof useWithdrawalForm>;
  onClose: () => void;
}

// 시안에 없는 단계라 약관 다이얼로그(460 폭, 헤더 60 · 안쪽 20)와 같은 계열의 작은 다이얼로그로 만듦(스펙 §3).
export function WithdrawPasswordDialog({
  form,
  onClose,
}: WithdrawPasswordDialogProps) {
  const { t } = useTranslation("features/withdraw-account");
  const { t: tCommon } = useTranslation();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !form.isSubmitting) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex w-115 max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-115"
      >
        <SubHeader
          title={
            <DialogTitle className="text-base leading-none font-semibold">
              {t("title")}
            </DialogTitle>
          }
          actions={
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost-foreground"
                size="icon"
                aria-label={tCommon("action.close")}
                disabled={form.isSubmitting}
              >
                <X />
              </Button>
            </DialogClose>
          }
        />
        <DialogDescription className="sr-only" />
        <WithdrawPasswordForm
          form={form}
          className="flex flex-col"
          contentClassName="px-5 pt-5"
          actionsClassName="p-5 pt-6"
          onClickCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
