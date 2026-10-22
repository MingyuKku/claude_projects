import { getPasswordError, isValidEmailFormat } from "@/entities/account";

import type { PasswordErrorCode } from "@/entities/account";

export interface ProfileFormValues {
  password: string;
  passwordCheck: string;
  email: string;
}

export interface ProfileFormErrors {
  password: PasswordErrorCode | null;
  passwordCheck: "mismatch" | null;
  email: "format" | null;
}

interface ProfileFormContext {
  /** 비밀번호에 아이디를 넣지 못하게 막는 데 씀. */
  identifier: string;
  /** 불러온 이메일. 바꾸지 않았다면 형식 검사를 건너뜀(옛 계정 값이 규칙에 안 맞을 수 있음). */
  initialEmail: string;
}

export function validateProfileForm(
  values: ProfileFormValues,
  { identifier, initialEmail }: ProfileFormContext,
): ProfileFormErrors {
  const isEmailChanged = values.email !== initialEmail;
  return {
    password: values.password
      ? getPasswordError(values.password, identifier)
      : null,
    // 확인 칸을 건드리기 전에는 보여주지 않고, 건드렸는데 다르면 보여줌.
    passwordCheck:
      values.passwordCheck && values.passwordCheck !== values.password
        ? "mismatch"
        : null,
    email:
      isEmailChanged && !isValidEmailFormat(values.email) ? "format" : null,
  };
}

export interface ProfileSavePlan {
  hasPasswordChange: boolean;
  hasEmailChange: boolean;
  hasImageChange: boolean;
}

export function getProfileSavePlan(
  values: ProfileFormValues,
  initialEmail: string,
  hasNewImage: boolean,
): ProfileSavePlan {
  return {
    hasPasswordChange: values.password !== "",
    hasEmailChange: values.email !== initialEmail,
    hasImageChange: hasNewImage,
  };
}

/** 바꾼 것이 있고, 오류가 없고, 비밀번호를 바꾸려면 확인 칸까지 같게 채웠을 때만 저장할 수 있음. */
export function canSaveProfile(
  values: ProfileFormValues,
  errors: ProfileFormErrors,
  plan: ProfileSavePlan,
) {
  const hasChange =
    plan.hasPasswordChange || plan.hasEmailChange || plan.hasImageChange;
  const hasError = Boolean(
    errors.password || errors.passwordCheck || errors.email,
  );
  const isPasswordPairIncomplete =
    plan.hasPasswordChange && values.passwordCheck !== values.password;
  return hasChange && !hasError && !isPasswordPairIncomplete;
}
