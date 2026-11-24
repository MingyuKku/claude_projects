import { ChevronRight } from "lucide-react";
import { useId } from "react";

import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";

import { useRegisterPanel } from "../../../model/use-register-panel";
import { useRegisterWizardStore } from "../../../model/wizard-context";

import type { RegisterTermsKind } from "../../../model/use-register-panel";
import type { CampaignPolicyAgreements } from "@/entities/campaign";

const POLICY_ITEMS: readonly {
  key: keyof CampaignPolicyAgreements;
  /** 전문을 열 약관. 캠페인 운영·리워드 정책은 원문이 없어 ">"를 숨김. */
  termsKind: RegisterTermsKind | null;
}[] = [
  { key: "service", termsKind: "service" },
  { key: "privacy", termsKind: "privacy" },
  { key: "operation", termsKind: null },
  { key: "reward", termsKind: null },
];

export function PolicyStep() {
  return (
    <Card className="ds-gap-4 ds-p-6">
      <PolicyAgreementList />
    </Card>
  );
}

interface PolicyAgreementListProps {
  className?: string;
}

// 7단계와 8단계 "약관 동의" 카드가 같은 값을 보이고 고침.
export function PolicyAgreementList({ className }: PolicyAgreementListProps) {
  const { t } = useTranslation("features/register-campaign");
  const allId = useId();
  const policy = useRegisterWizardStore((state) => state.draft.policy);
  const setStepDraft = useRegisterWizardStore((state) => state.setStepDraft);
  const { openTerms } = useRegisterPanel();

  const isAllAgreed = POLICY_ITEMS.every(({ key }) => policy[key]);

  function handleChangeAll(isChecked: boolean) {
    setStepDraft("policy", {
      service: isChecked,
      privacy: isChecked,
      operation: isChecked,
      reward: isChecked,
    });
  }

  return (
    <div className={cn("flex flex-col ds-gap-4", className)}>
      <div className="flex items-center gap-2 rounded-md bg-muted p-4">
        <Checkbox
          id={allId}
          checked={isAllAgreed}
          onCheckedChange={(checked) => handleChangeAll(checked === true)}
        />
        <label
          htmlFor={allId}
          className="flex-1 cursor-pointer ds-text-sm-none-medium"
        >
          {t("policy.all")}
        </label>
      </div>
      <ul className="flex flex-col ds-gap-4 pl-4">
        {POLICY_ITEMS.map(({ key, termsKind }) => (
          <PolicyItem
            key={key}
            label={t(`policy.items.${key}`)}
            isChecked={policy[key]}
            onChangeChecked={(isChecked) =>
              setStepDraft("policy", { ...policy, [key]: isChecked })
            }
            viewLabel={termsKind ? t(`policy.terms.${termsKind}`) : null}
            onClickView={termsKind ? () => openTerms(termsKind) : undefined}
          />
        ))}
      </ul>
    </div>
  );
}

interface PolicyItemProps {
  label: string;
  isChecked: boolean;
  onChangeChecked: (isChecked: boolean) => void;
  /** ">" 버튼의 접근 가능한 이름(약관 제목). 없으면 ">"를 숨김. */
  viewLabel: string | null;
  onClickView?: () => void;
}

function PolicyItem({
  label,
  isChecked,
  onChangeChecked,
  viewLabel,
  onClickView,
}: PolicyItemProps) {
  const id = useId();

  return (
    <li className="flex h-5 items-center gap-2">
      <Checkbox
        id={id}
        checked={isChecked}
        onCheckedChange={(checked) => onChangeChecked(checked === true)}
      />
      <label
        htmlFor={id}
        className="flex flex-1 cursor-pointer gap-0.5 ds-text-sm-none-normal"
      >
        {label}
        <span aria-hidden className="ds-text-sm-none-semibold text-primary">
          *
        </span>
      </label>
      {viewLabel && (
        <Button
          variant="ghost-muted"
          size="icon-xss"
          aria-label={viewLabel}
          onClick={onClickView}
        >
          <ChevronRight aria-hidden />
        </Button>
      )}
    </li>
  );
}
