import { AuthButton, AuthText } from "@/shared/components/auth";
import { Trans, useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

interface ExpiredPasswordDoneProps {
  className?: string;
  onClickLogin: () => void;
}

/** 비밀번호 변경이 끝났을 때 보여 주는 완료 화면. */
export function ExpiredPasswordDone({
  className,
  onClickLogin,
}: ExpiredPasswordDoneProps) {
  const { t } = useTranslation("features/expired-password");

  return (
    <div
      className={cn(
        "flex min-h-dvh items-center justify-center bg-background",
        className,
      )}
    >
      <div className="flex w-80 flex-col items-center gap-6 text-center tablet:w-96">
        <AuthText size="lg" weight="bold">
          {t("done.title")}
        </AuthText>
        <AuthText size="sm">
          <Trans t={t} i18nKey="done.message" components={{ br: <br /> }} />
        </AuthText>
        <div className="h-12 w-full">
          <AuthButton color="primary" onClick={onClickLogin}>
            <AuthText as="span">{t("done.login")}</AuthText>
          </AuthButton>
        </div>
      </div>
    </div>
  );
}
