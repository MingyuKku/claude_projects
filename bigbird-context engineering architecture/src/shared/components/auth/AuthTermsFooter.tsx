import { Link } from "react-router";

import { TERMS_LINKS } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { AuthText } from "./AuthText";

interface AuthTermsFooterProps {
  className?: string;
}

/** 태블릿 이상에서 화면 아래에 약관 링크를 보여 주는 푸터. 모바일에서는 숨김. */
export function AuthTermsFooter({ className }: AuthTermsFooterProps) {
  const { t } = useTranslation();

  return (
    <footer
      className={cn(
        "absolute bottom-5 hidden items-center gap-10 tablet:flex",
        className,
      )}
    >
      {TERMS_LINKS.map((link) => (
        <Link key={link.to} to={link.to}>
          <AuthText size="sm" tone="heading">
            {t(link.labelKey)}
          </AuthText>
        </Link>
      ))}
    </footer>
  );
}
