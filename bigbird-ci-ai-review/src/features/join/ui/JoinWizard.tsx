import { useJoinStore } from "../model/join-store-context";
import { CertIntroStep } from "./CertIntroStep";
import { JoinCompanyStep } from "./JoinCompanyStep";
import { JoinInfoStep } from "./JoinInfoStep";
import { JoinStoreProvider } from "./JoinStoreProvider";
import { JoinTermsStep } from "./JoinTermsStep";

import type { SnsTokenData } from "../model/types";
import type { SocialLinker } from "./JoinTermsStep";

interface JoinWizardProps {
  /** Present when the visitor came from SNS and is creating a new account. */
  tokenData?: SnsTokenData | null;
  /** Links the SNS identity to the new account; injected by the page because features cannot import each other. */
  onLinkSocial?: SocialLinker;
}

function JoinSteps({ onLinkSocial }: Pick<JoinWizardProps, "onLinkSocial">) {
  const stage = useJoinStore((state) => state.stage);
  const certIdx = useJoinStore((state) => state.account.certIdx);

  // The remaining steps cannot render before verification; certIdx marks it done.
  if (certIdx === null) {
    return (
      // No fixed bottom button here, so the whole screen scrolls.
      <div className="flex min-h-dvh flex-col items-center bg-background">
        <div className="flex w-80 flex-col tablet:w-96">
          <CertIntroStep />
        </div>
      </div>
    );
  }

  return (
    // The other steps pin their bottom button, so only the inside scrolls.
    <div className="flex h-dvh flex-col items-center overflow-hidden bg-background">
      <div className="flex min-h-0 w-80 flex-1 flex-col tablet:w-96">
        {stage === "info" && <JoinInfoStep />}
        {stage === "company" && <JoinCompanyStep />}
        {stage === "terms" && <JoinTermsStep onLinkSocial={onLinkSocial} />}
      </div>
    </div>
  );
}

export function JoinWizard({
  tokenData = null,
  onLinkSocial,
}: JoinWizardProps) {
  return (
    <JoinStoreProvider tokenData={tokenData}>
      <JoinSteps onLinkSocial={onLinkSocial} />
    </JoinStoreProvider>
  );
}
