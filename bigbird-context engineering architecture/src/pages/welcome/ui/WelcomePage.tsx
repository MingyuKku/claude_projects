import bigbirdLogo from "@/shared/assets/img/auth/bigbird-logo.svg";
import chevronRightWhite from "@/shared/assets/img/system/chevron-right-white.svg";
import { AuthButton, AuthHeading, AuthText } from "@/shared/components/auth";
import { Trans, useTranslation } from "@/shared/i18n";

const BIGBIRD_SITE_URL = "https://bigbird.co.kr/";

/** 가입의 마지막 화면. 승인 대기 중이라는 안내만 함. */
export function WelcomePage() {
  const { t } = useTranslation("pages/welcome");

  function handleClickBrowse() {
    window.open(BIGBIRD_SITE_URL, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="flex min-h-dvh flex-col items-center bg-background">
      <title>{t("title")}</title>
      <div className="flex w-80 flex-1 flex-col items-center tablet:w-96 tablet:justify-center tablet:gap-12">
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-6 tablet:flex-none">
          <img
            src={bigbirdLogo}
            alt={t("logoAlt")}
            className="h-auto w-[174px] tablet:w-[154px] desktop:w-[174px]"
          />

          <div className="flex flex-col items-center gap-5 p-10 text-center">
            <AuthHeading
              type="headline-3"
              as="h1"
              tone="heading"
              className="font-medium tracking-[1px]"
            >
              {t("heading")}
            </AuthHeading>
            <AuthText size="md">
              <Trans t={t} i18nKey="message" components={{ br: <br /> }} />
            </AuthText>
          </div>
        </div>

        <div className="mb-5 h-12 w-full tablet:mb-0">
          <AuthButton
            color="primary"
            className="gap-2"
            onClick={handleClickBrowse}
          >
            <AuthText as="span" size="fixed-base" tone="inherit">
              {t("browse")}
            </AuthText>
            <img src={chevronRightWhite} alt="" className="size-4" />
          </AuthButton>
        </div>
      </div>
    </main>
  );
}
