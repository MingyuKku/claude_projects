import { formatPhoneNumber } from "@/entities/account";
import { FormRow } from "@/shared/components/form-field";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import type { PhoneVerificationState } from "../lib/phone-verification";

interface PhoneVerifyRowProps {
  /** 지금 등록된 번호. 인증을 마치면 인증한 번호를 대신 보임. */
  phone: string;
  verification: PhoneVerificationState;
  onClickVerify: () => void;
}

// 문구는 시안에 없어 v2 문구를 임시로 씀(스펙 §7 P-6).
const ERROR_KEYS = {
  failed: "form.phone.verification.failed",
  duplicate: "form.phone.verification.duplicate",
  popupBlocked: "form.phone.verification.popupBlocked",
} as const;

function readErrorKey(verification: PhoneVerificationState) {
  if (verification.status in ERROR_KEYS) {
    return ERROR_KEYS[verification.status as keyof typeof ERROR_KEYS];
  }
  return null;
}

/** 휴대폰 번호 행: 번호는 직접 고치지 않고 KMC 본인인증으로만 바꿈. */
export function PhoneVerifyRow({
  phone,
  verification,
  onClickVerify,
}: PhoneVerifyRowProps) {
  const { t } = useTranslation("features/edit-account-profile");
  const isVerified = verification.status === "verified";
  const errorKey = readErrorKey(verification);

  return (
    <FormRow
      label={t("form.phone.label")}
      helpText={isVerified ? t("form.phone.verification.success") : undefined}
      errorText={errorKey ? t(errorKey) : undefined}
    >
      {(control) => (
        <div className="flex items-center gap-2">
          <Input
            {...control}
            readOnly
            value={formatPhoneNumber(isVerified ? verification.phone : phone)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={verification.status === "verifying"}
            onClick={onClickVerify}
          >
            {t("form.phone.verify")}
          </Button>
        </div>
      )}
    </FormRow>
  );
}
