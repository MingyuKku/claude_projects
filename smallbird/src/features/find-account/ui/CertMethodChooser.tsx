import { AuthButton, AuthText } from "@/shared/components/auth";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { CERT_METHODS } from "../model/constants";

import type { CertMethod } from "../model/use-cert-flow";

interface CertMethodChooserProps {
  isDisabled?: boolean;
  onClickSelect: (method: CertMethod) => void;
  className?: string;
}

export function CertMethodChooser({
  isDisabled = false,
  onClickSelect,
  className,
}: CertMethodChooserProps) {
  const { t } = useTranslation("features/find-account");

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div className="flex items-center gap-5">
        <div className="h-px flex-1 bg-gray-500" />
        <AuthText
          as="span"
          size="sm"
          tone="muted"
          className="whitespace-nowrap"
        >
          {t("chooser")}
        </AuthText>
        <div className="h-px flex-1 bg-gray-500" />
      </div>
      <div className="flex flex-col gap-3">
        {CERT_METHODS.map((method) => (
          <div key={method.key} className="h-12">
            <AuthButton
              color="primary"
              disabled={isDisabled}
              onClick={() => onClickSelect(method.key)}
            >
              <AuthText as="span" size="fixed-base" tone="inherit">
                {t(method.labelKey)}
              </AuthText>
            </AuthButton>
          </div>
        ))}
      </div>
    </div>
  );
}
