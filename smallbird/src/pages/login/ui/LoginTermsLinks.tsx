import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

interface LoginTermsLinksProps {
  onClickPrivacy: () => void;
  onClickTerms: () => void;
}

/** 태블릿 이상에서 화면 아래에 놓이는 약관 버튼. 모바일은 "…" 메뉴를 씀. */
export function LoginTermsLinks({
  onClickPrivacy,
  onClickTerms,
}: LoginTermsLinksProps) {
  const { t } = useTranslation();

  return (
    <div className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center ds-gap-3 tablet:flex">
      <Button
        variant="ghost-muted"
        size="sm"
        className="h-8.5 desktop:h-9"
        onClick={onClickPrivacy}
      >
        {t("link.privacy")}
      </Button>
      <Button
        variant="ghost-muted"
        size="sm"
        className="h-8.5 desktop:h-9"
        onClick={onClickTerms}
      >
        {t("link.terms")}
      </Button>
    </div>
  );
}
