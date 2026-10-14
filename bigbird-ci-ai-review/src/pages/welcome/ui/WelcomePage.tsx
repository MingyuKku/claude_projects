import bigbirdLogo from "@/shared/assets/img/auth/bigbird-logo.svg";
import chevronRightWhite from "@/shared/assets/img/system/chevron-right-white.svg";
import { AuthButton, AuthHeading, AuthText } from "@/shared/components/auth";

const BIGBIRD_SITE_URL = "https://bigbird.co.kr/";

/** Last join screen; it only tells the user the approval is pending. */
export function WelcomePage() {
  function handleClickBrowse() {
    window.open(BIGBIRD_SITE_URL, "_blank");
  }

  return (
    <main className="flex min-h-dvh flex-col items-center bg-background">
      <title>가입 완료</title>
      <div className="flex w-80 flex-1 flex-col items-center tablet:w-96 tablet:justify-center tablet:gap-12">
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-6 tablet:flex-none">
          <img
            src={bigbirdLogo}
            alt="빅버드로고"
            className="h-auto w-[174px] tablet:w-[154px] desktop:w-[174px]"
          />

          <div className="flex flex-col items-center gap-5 p-10 text-center">
            <AuthHeading
              type="headline-3"
              as="h1"
              className="font-medium! tracking-[1px] text-heading!"
            >
              파트너가 되어 반가워요! 🤗
            </AuthHeading>
            <AuthText size="md">
              광고주 회원가입을 검토 중입니다.
              <br />
              회원가입 승인 후 문자메세지를 통해
              <br />
              빠르게 연락드리겠습니다
            </AuthText>
          </div>
        </div>

        <div className="mb-5 h-12 w-full tablet:mb-0">
          <AuthButton
            color="primary"
            className="gap-2"
            onClick={handleClickBrowse}
          >
            <AuthText
              as="span"
              size="md"
              className="text-[16px]! text-inherit!"
            >
              BIGBIRD 둘러보기
            </AuthText>
            <img src={chevronRightWhite} alt="" className="size-4" />
          </AuthButton>
        </div>
      </div>
    </main>
  );
}
