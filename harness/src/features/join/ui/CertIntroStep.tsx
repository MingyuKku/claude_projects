import { useNavigate } from "react-router";

import {
  AlertPopup,
  AuthButton,
  AuthHeader,
  AuthText,
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
    <div className="flex flex-col gap-12 pb-12">
      <AuthHeader
        title={t("cert.header")}
        onClickBack={() => navigate(ROUTES.login)}
        progress={JOIN_STEP_PROGRESS.cert}
      />

      <AuthText size="xl" weight="bold" tone="heading">
        <Trans t={t} i18nKey="cert.title" components={{ br: <br /> }} />
      </AuthText>

      <div className="h-12 w-full">
        <AuthButton color="primary" onClick={() => void cert.open()}>
          <AuthText as="span" tone="light">
            {t("cert.button")}
          </AuthText>
        </AuthButton>
      </div>

      {import.meta.env.DEV && (
        <button
          type="button"
          className="text-gray-400 underline"
          onClick={handleClickDevSkip}
        >
          <AuthText as="span" size="sm">
            {t("dev.skipCert")}
          </AuthText>
        </button>
      )}

      {cert.result.status === "fail" && (
        <AuthText size="sm" tone="negative" role="alert">
          {cert.result.message || t("cert.failFallback")}
        </AuthText>
      )}
      {cert.result.status === "exists" && (
        <AuthText size="sm" tone="negative" role="alert">
          {t("cert.exists")}
        </AuthText>
      )}

      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-5">
          <div className="h-px flex-1 bg-gray-400" />
          <AuthText
            as="span"
            size="sm"
            weight="bold"
            tone="faint"
            className="whitespace-nowrap"
          >
            {t("cert.noticeTitle")}
          </AuthText>
          <div className="h-px flex-1 bg-gray-400" />
        </div>
        {CERT_INTRO_NOTICES.map((notice) => (
          <div key={notice} className="rounded-[20px] bg-gray-100 p-5">
            <AuthText size="sm">{t(`cert.notice.${notice}`)}</AuthText>
          </div>
        ))}
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
