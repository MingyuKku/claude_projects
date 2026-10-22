import { AlertPopup } from "@/shared/components/auth";
import { Trans, useTranslation } from "@/shared/i18n";

import type { CertFlow } from "../model/use-cert-flow";

interface CertPopupsProps {
  flow: CertFlow;
}

// 브라우저 기본 alert()는 쓰지 않음. 고객 대상 서비스라 기본 대화상자로는
// 화면의 톤과 문구를 맞출 수 없음.
export function CertPopups({ flow }: CertPopupsProps) {
  const { t } = useTranslation("features/find-account");
  const { t: tCommon } = useTranslation();

  return (
    <>
      {flow.isResendPopupOpen && (
        <AlertPopup
          title={t("resendTitle")}
          message={
            <Trans t={t} i18nKey="resendMessage" components={{ br: <br /> }} />
          }
          confirmLabel={tCommon("action.confirm")}
          onClickConfirm={flow.closeResendPopup}
        />
      )}

      {flow.alertMessage !== null && (
        <AlertPopup
          title={t("alertTitle")}
          message={
            <span className="whitespace-pre-line">
              {t(`message.${flow.alertMessage.code}`, flow.alertMessage.values)}
            </span>
          }
          confirmLabel={tCommon("action.confirm")}
          onClickConfirm={flow.dismissAlert}
        />
      )}
    </>
  );
}
