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

import { useAgreeTerms } from "../../model/use-agree-terms";
import { useRegisterPanel } from "../../model/use-register-panel";
import { TermsBox } from "./TermsBox";

export function RegisterTermsDialog() {
  const { t } = useTranslation("features/register-campaign");
  const { t: tCommon } = useTranslation();
  const { panel, termsKind, closePanel } = useRegisterPanel();
  const agreeTerms = useAgreeTerms();

  return (
    <Dialog
      open={panel === "terms"}
      onOpenChange={(isOpen) => !isOpen && closePanel()}
    >
      <DialogContent
        showCloseButton={false}
        className="flex h-162.5 max-h-[calc(100dvh-2rem)] w-115 max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-115"
      >
        {termsKind && (
          <>
            <SubHeader
              title={
                <DialogTitle className="ds-text-base-none-semibold">
                  {t(`policy.terms.${termsKind}`)}
                </DialogTitle>
              }
              actions={
                <DialogClose asChild>
                  <Button
                    variant="ghost-foreground"
                    size="icon"
                    aria-label={tCommon("action.close")}
                  >
                    <X />
                  </Button>
                </DialogClose>
              }
            />
            {/* 설명은 본문(약관) 자체라 별도 문구 없이 접근성 연결만 비워 둠. */}
            <DialogDescription className="sr-only" />
            <div className="flex min-h-0 flex-1 flex-col px-5 pt-5 pb-3">
              <TermsBox kind={termsKind} />
            </div>
            <div className="flex gap-2 p-5">
              <Button variant="outline" className="flex-1" onClick={closePanel}>
                {tCommon("action.cancel")}
              </Button>
              <Button className="flex-1" onClick={agreeTerms}>
                {t("policy.agree")}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
