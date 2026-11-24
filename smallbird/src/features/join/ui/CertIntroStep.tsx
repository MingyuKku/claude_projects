import { useNavigate } from "react-router";

import {
  AlertPopup,
  AuthButton,
  AuthHeader,
  AuthSupportText,
  AuthText,
  AuthTextButton,
} from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";
import { Trans, useTranslation } from "@/shared/i18n";

import { useCertAuth } from "../lib/use-cert-auth";
import {
  CERT_INTRO_NOTICES,
  DEV_CERT_SKIP,
  JOIN_STEP_PROGRESS,
} from "../model/constants";
import { useJoinStore } from "../model/join-store-context";

export function CertIntroStep() {
  const { t } = useTranslation("features/join");
  const { t: tCommon } = useTranslation();
  const applyCertSuccess = useJoinStore((state) => state.applyCertSuccess);
  const navigate = useNavigate();
  const cert = useCertAuth(applyCertSuccess);

  function handleClickDevSkip() {
    applyCertSuccess(DEV_CERT_SKIP);
  }

  return (
    <div className="flex flex-col">
      <AuthHeader
        title={t("cert.header")}
        onClickBack={() => navigate(ROUTES.login)}
        progress={JOIN_STEP_PROGRESS.cert}
      />

      <div className="flex flex-col gap-12 pt-7.5 pb-12 tablet:pt-12">
        <AuthText size="xl" weight="medium" tone="heading">
          <Trans t={t} i18nKey="cert.title" components={{ br: <br /> }} />
        </AuthText>

        <div className="h-12 w-full">
          <AuthButton color="primary" onClick={() => void cert.open()}>
            <AuthText as="span" size="fixed-base" tone="inherit">
              {t("cert.button")}
            </AuthText>
          </AuthButton>
        </div>

        {import.meta.env.DEV && (
          <AuthTextButton onClick={handleClickDevSkip}>
            {t("dev.skipCert")}
          </AuthTextButton>
        )}

        {cert.result.status === "fail" && (
          <AuthSupportText state="error" role="alert">
            {cert.result.message || t("cert.failFallback")}
          </AuthSupportText>
        )}
        {cert.result.status === "exists" && (
          <AuthSupportText state="error" role="alert">
            {t("cert.exists")}
          </AuthSupportText>
        )}

        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-5">
            <div className="h-px flex-1 bg-gray-500" />
            <AuthText
              as="span"
              size="sm"
              tone="muted"
              className="whitespace-nowrap"
            >
              {t("cert.noticeTitle")}
            </AuthText>
            <div className="h-px flex-1 bg-gray-500" />
          </div>
          {CERT_INTRO_NOTICES.map((notice) => (
            <div key={notice} className="rounded-[20px] bg-gray-100 p-5">
              <AuthText size="sm">{t(`cert.notice.${notice}`)}</AuthText>
            </div>
          ))}
        </div>
      </div>

      {cert.isPopupBlocked && (
        <AlertPopup
          title={t("cert.popupBlocked.title")}
          message={t("cert.popupBlocked.message")}
          confirmLabel={tCommon("action.confirm")}
          onClickConfirm={() => cert.setIsPopupBlocked(false)}
        />
      )}
    </div>
  );
}
