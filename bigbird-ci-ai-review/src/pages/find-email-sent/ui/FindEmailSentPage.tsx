import { useNavigate } from "react-router";

import { AuthButton, AuthHeader, AuthText } from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";

/** End of the email path of the password lookup: the link goes by mail, this screen only informs. */
export function FindEmailSentPage() {
  const navigate = useNavigate();

  function handleClickGoLogin() {
    void navigate(ROUTES.login);
  }

  return (
    <main className="flex min-h-dvh flex-col items-center bg-background">
      <title>비밀번호 재설정 링크 발송</title>
      <AuthHeader
        title="비밀번호 재설정 링크 발송"
        onClickBack={handleClickGoLogin}
        hideBackOnMobile
      />

      <div className="flex w-80 flex-1 flex-col tablet:w-96">
        <div className="flex flex-1 flex-col tablet:flex-none tablet:gap-12">
          <div className="flex flex-1 items-center tablet:flex-none tablet:py-10">
            <AuthText size="md" className="w-full text-center">
              등록된 이메일로 비밀번호 재설정 링크를 발송하였습니다.
              <br />
              해당 링크를 통해 비밀번호를 재설정해 주세요.
            </AuthText>
          </div>

          <div className="mb-5 h-12 tablet:mb-0">
            <AuthButton color="primary" onClick={handleClickGoLogin}>
              <AuthText as="span" size="md" className="text-inherit!">
                처음으로
              </AuthText>
            </AuthButton>
          </div>
        </div>
      </div>
    </main>
  );
}
