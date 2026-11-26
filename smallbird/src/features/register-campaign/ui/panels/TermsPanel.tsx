import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { useAgreeTerms } from "../../model/use-agree-terms";
import { useRegisterPanel } from "../../model/use-register-panel";
import { PanelLayout } from "./PanelLayout";
import { TermsBox } from "./TermsBox";

export function TermsPanel() {
  const { t } = useTranslation("features/register-campaign");
  const { t: tCommon } = useTranslation();
  const { termsKind, closePanel } = useRegisterPanel();
  const agreeTerms = useAgreeTerms();

  if (!termsKind) return null;

  return (
    <PanelLayout
      title={t(`policy.terms.${termsKind}`)}
      onClose={closePanel}
      isBodyFixed
      footer={
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={closePanel}>
            {tCommon("action.cancel")}
          </Button>
          <Button className="flex-1" onClick={agreeTerms}>
            {t("policy.agree")}
          </Button>
        </div>
      }
    >
      <div className="flex h-full min-h-0 flex-col px-4 pt-4">
        <TermsBox kind={termsKind} />
      </div>
    </PanelLayout>
  );
}
