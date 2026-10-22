import { useNavigate } from "react-router";

import { AuthButton, AuthHeader, AuthText } from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";
import { Trans, useTranslation } from "@/shared/i18n";

/** 비밀번호 찾기 이메일 경로의 마지막 화면. 링크는 메일로 가고, 이 화면은 안내만 함. */
export function FindEmailSentPage() {
  const { t } = useTranslation("pages/find-email-sent");
  const navigate = useNavigate();

  function handleClickGoLogin() {
    void navigate(ROUTES.login);
  }

  return (
    <main className="flex min-h-dvh flex-col items-center bg-background">
      <title>{t("title")}</title>
      <AuthHeader
        title={t("title")}
        onClickBack={handleClickGoLogin}
        isBackHiddenOnMobile
      />

      <div className="flex w-80 flex-1 flex-col tablet:w-96">
        <div className="flex flex-1 flex-col tablet:flex-none tablet:gap-12">
          <div className="flex flex-1 items-center tablet:flex-none tablet:py-10">
            <AuthText size="md" className="w-full text-center">
              <Trans t={t} i18nKey="message" components={{ br: <br /> }} />
            </AuthText>
          </div>

          <div className="mb-5 h-12 tablet:mb-0">
            <AuthButton color="primary" onClick={handleClickGoLogin}>
              <AuthText as="span" size="md" tone="inherit">
                {t("start")}
              </AuthText>
            </AuthButton>
          </div>
        </div>
      </div>
    </main>
  );
}
