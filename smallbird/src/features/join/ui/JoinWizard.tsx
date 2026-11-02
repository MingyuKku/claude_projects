import { useJoinStore } from "../model/join-store-context";
import { CertIntroStep } from "./CertIntroStep";
import { JoinCompanyStep } from "./JoinCompanyStep";
import { JoinInfoStep } from "./JoinInfoStep";
import { JoinStoreProvider } from "./JoinStoreProvider";
import { JoinTermsStep } from "./JoinTermsStep";

import type { SocialLinker } from "../lib/use-submit-join";
import type { SnsTokenData } from "../model/types";

interface JoinWizardProps {
  /** SNS로 들어와 새 계정을 만드는 경우에만 있음. */
  tokenData?: SnsTokenData | null;
  /** SNS 신원을 새 계정에 연동함. feature끼리 임포트할 수 없어 페이지가 주입함. */
  onLinkSocial?: SocialLinker;
}

interface JoinStepsProps {
  onLinkSocial?: SocialLinker;
}

function JoinSteps({ onLinkSocial }: JoinStepsProps) {
  const stage = useJoinStore((state) => state.stage);
  const certIdx = useJoinStore((state) => state.account.certIdx);

  // 나머지 단계는 인증 전에 렌더할 수 없음. certIdx가 있으면 인증이 끝난 것.
  if (certIdx === null) {
    return (
      // 여기는 하단 고정 버튼이 없어서 화면 전체가 스크롤됨.
      <div className="flex min-h-dvh flex-col items-center bg-background">
        <div className="flex w-80 flex-col tablet:w-96">
          <CertIntroStep />
        </div>
      </div>
    );
  }

  return (
    // 다른 단계는 하단 버튼을 고정하므로 안쪽만 스크롤됨.
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
