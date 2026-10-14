import { AlertPopup } from "@/shared/components/auth";

import type { CertFlow } from "../model/use-cert-flow";

interface Props {
  flow: CertFlow;
}

// Browser-native alert() is avoided: this is a customer-facing product and the
// default dialog cannot match the screen's tone or wording.
export function CertPopups({ flow }: Props) {
  return (
    <>
      {flow.isResendPopupOpen && (
        <AlertPopup
          title="인증번호 재전송"
          message={
            <>
              인증시간(1분)이 종료된 후
              <br />
              다시 시도해주세요.
            </>
          }
          confirmLabel="확인"
          onClickConfirm={() => flow.setIsResendPopupOpen(false)}
        />
      )}

      {flow.alertMessage !== null && (
        <AlertPopup
          title="알림"
          message={
            <span className="whitespace-pre-line">{flow.alertMessage}</span>
          }
          confirmLabel="확인"
          onClickConfirm={() => flow.setAlertMessage(null)}
        />
      )}
    </>
  );
}
