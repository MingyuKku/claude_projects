import { FormRow, PasswordInput } from "@/shared/components/form-field";
import { useTranslation } from "@/shared/i18n";

import { PASSWORD_MAX_LENGTH } from "../model/constants";

import type { validateProfileForm } from "../lib/profile-form";
import type { ChangeEvent } from "react";

type PasswordField = "password" | "passwordCheck";

interface ProfilePasswordFieldsProps {
  values: Record<PasswordField, string>;
  errors: ReturnType<typeof validateProfileForm>;
  onChangeField: (
    field: PasswordField,
  ) => (event: ChangeEvent<HTMLInputElement>) => void;
}

// 비밀번호 변경·확인 두 칸. 현재 비밀번호 칸은 없음(서버가 새 비밀번호만 받음, 스펙 §3).
export function ProfilePasswordFields({
  values,
  errors,
  onChangeField,
}: ProfilePasswordFieldsProps) {
  const { t } = useTranslation("features/edit-account-profile");
  const { t: tCommon } = useTranslation();
  const passwordLabel = t("form.password.label");
  const passwordCheckLabel = t("form.passwordCheck.label");

  return (
    <>
      <FormRow
        label={passwordLabel}
        errorText={
          errors.password
            ? t(`form.password.error.${errors.password}`)
            : undefined
        }
      >
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="new-password"
            maxLength={PASSWORD_MAX_LENGTH}
            placeholder={t("form.password.placeholder")}
            value={values.password}
            onChange={onChangeField("password")}
            showLabel={tCommon("password.show", { label: passwordLabel })}
            hideLabel={tCommon("password.hide", { label: passwordLabel })}
          />
        )}
      </FormRow>
      <FormRow
        label={passwordCheckLabel}
        errorText={
          errors.passwordCheck ? t("form.passwordCheck.mismatch") : undefined
        }
      >
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="new-password"
            maxLength={PASSWORD_MAX_LENGTH}
            placeholder={t("form.passwordCheck.placeholder")}
            value={values.passwordCheck}
            onChange={onChangeField("passwordCheck")}
            showLabel={tCommon("password.show", { label: passwordCheckLabel })}
            hideLabel={tCommon("password.hide", { label: passwordCheckLabel })}
          />
        )}
      </FormRow>
    </>
  );
}
