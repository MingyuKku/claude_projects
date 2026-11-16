import { X } from "lucide-react";

import { SubHeader } from "@/shared/components/app-header";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { WithdrawPasswordForm } from "./WithdrawPasswordForm";

import type { useWithdrawalForm } from "../lib/use-withdrawal-form";

interface WithdrawPasswordScreenProps {
  form: ReturnType<typeof useWithdrawalForm>;
  onClose: () => void;
}

export function WithdrawPasswordScreen({
  form,
  onClose,
}: WithdrawPasswordScreenProps) {
  const { t } = useTranslation("features/withdraw-account");
  const { t: tCommon } = useTranslation();

  return (
    <div className="-mx-(--mypage-gutter) flex min-h-full flex-col">
      <SubHeader
        className="sticky top-0 z-10"
        title={<h1>{t("title")}</h1>}
        actions={
          <Button
            type="button"
            variant="ghost-foreground"
            size="icon"
            aria-label={tCommon("action.close")}
            disabled={form.isSubmitting}
            onClick={onClose}
          >
            <X />
          </Button>
        }
      />
      <WithdrawPasswordForm
        form={form}
        className="flex flex-1 flex-col"
        contentClassName="flex-1 p-4"
        actionsClassName="sticky bottom-0 bg-background p-4"
        onClickCancel={onClose}
      />
    </div>
  );
}
