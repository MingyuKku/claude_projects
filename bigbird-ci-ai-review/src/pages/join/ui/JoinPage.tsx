import { useLocation } from "react-router";

import { JoinWizard, readSnsTokenData } from "@/features/join";
import { socialLink } from "@/features/social-login";

export function JoinPage() {
  const { state } = useLocation();
  // SNS sign-ups arrive with the identity to link as router state.
  const tokenData = readSnsTokenData(state);

  return (
    <>
      <title>회원가입</title>
      <JoinWizard tokenData={tokenData} onLinkSocial={socialLink} />
    </>
  );
}
