import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { AuthTextButton } from "./AuthTextButton";

interface AuthTermsFooterProps {
  /** 약관을 어떻게 보여 줄지는 화면이 정함(이 컴포넌트는 entities를 알 수 없음). */
  onClickPrivacy: () => void;
  onClickTerms: () => void;
  className?: string;
}

/** 태블릿 이상에서 화면 아래에 약관 링크를 보여 주는 푸터. 모바일에서는 숨김. */
export function AuthTermsFooter({
  onClickPrivacy,
  onClickTerms,
  className,
}: AuthTermsFooterProps) {
  const { t } = useTranslation();

  return (
    <footer
      className={cn(
        "absolute bottom-5 hidden items-center gap-10 tablet:flex",
        className,
      )}
    >
      <AuthTextButton variant="plain" onClick={onClickPrivacy}>
        {t("link.privacy")}
      </AuthTextButton>
      <AuthTextButton variant="plain" onClick={onClickTerms}>
        {t("link.terms")}
      </AuthTextButton>
    </footer>
  );
}
