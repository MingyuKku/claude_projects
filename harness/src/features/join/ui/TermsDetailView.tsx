import { TermsDocument } from "@/entities/terms";
import { AuthButton, AuthHeader, AuthText } from "@/shared/components/auth";
import { useTranslation } from "@/shared/i18n";

import type { TermsKind } from "@/entities/terms";

interface TermsDetailViewProps {
  title: string;
  kind: TermsKind;
  confirmLabel: string;
  progress: number;
  onClickBack: () => void;
  onClickConfirm: () => void;
}

/** Full-text terms reader shown when an item is opened from the consent step. */
export function TermsDetailView({
  title,
  kind,
  confirmLabel,
  progress,
  onClickBack,
  onClickConfirm,
}: TermsDetailViewProps) {
  const { t } = useTranslation("features/join");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AuthHeader
        title={t("header")}
        onClickBack={onClickBack}
        progress={progress}
      />

      {/* Mobile scrolls the whole screen; tablet and up scrolls only inside the text box. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto tablet:overflow-visible">
        <div className="flex flex-col gap-6 pt-[30px] tablet:min-h-0 tablet:flex-1 tablet:pt-6">
          <AuthText size="md" weight="bold" tone="heading">
            {title}
          </AuthText>

          <div className="flex flex-col gap-4 rounded-[20px] border border-gray-200 bg-light p-5 tablet:min-h-0 tablet:flex-1 tablet:overflow-y-auto">
            <TermsDocument kind={kind} />
          </div>
        </div>
      </div>

      <div className="shrink-0 py-5 tablet:mt-12 tablet:pt-0 tablet:pb-20">
        <div className="h-12">
          <AuthButton color="primary" onClick={onClickConfirm}>
            <AuthText as="span" tone="light">
              {confirmLabel}
            </AuthText>
          </AuthButton>
        </div>
      </div>
    </div>
  );
}
