import { cva } from "class-variance-authority";

import type { AccountFields, CompanyFields, TermsFields } from "../model/types";

export type FieldState = "default" | "error" | "success";

/** 오류가 성공보다 우선해 테두리 상태를 정함. */
export function resolveInputState(
  isError: boolean,
  isSuccess: boolean,
): FieldState {
  if (isError) return "error";
  if (isSuccess) return "success";
  return "default";
}

const messageVariants = cva("", {
  variants: {
    tone: {
      success: "text-positive!",
      error: "text-negative!",
      neutral: "text-gray-400!",
    },
  },
  defaultVariants: { tone: "neutral" },
});

/** 성공이 오류보다 우선해 안내 문구 색을 정함. */
export function resolveMessageClass(isError: boolean, isSuccess: boolean) {
  if (isSuccess) return messageVariants({ tone: "success" });
  if (isError) return messageVariants({ tone: "error" });
  return messageVariants({ tone: "neutral" });
}

interface InfoGateInput extends Pick<
  AccountFields,
  "id" | "password" | "passwordAgain" | "idStatus"
> {
  passwordError: string | null;
}

export function isPasswordAgainMatching(
  password: string,
  passwordAgain: string,
) {
  return passwordAgain !== "" && password === passwordAgain;
}

export function canProceedFromInfo(input: InfoGateInput) {
  return (
    Boolean(input.id && input.password && input.passwordAgain) &&
    input.idStatus === "possible" &&
    !input.passwordError &&
    isPasswordAgainMatching(input.password, input.passwordAgain)
  );
}

export function canProceedFromCompany(
  account: Pick<AccountFields, "email" | "emailStatus">,
  company: Pick<
    CompanyFields,
    | "companyName"
    | "companyContact"
    | "companyRegistrationUploaded"
    | "companyRegistrationNumber"
  >,
) {
  return Boolean(
    company.companyName &&
    company.companyContact &&
    company.companyRegistrationUploaded &&
    company.companyRegistrationNumber &&
    account.email &&
    account.emailStatus === "possible",
  );
}

export function canSubmitTerms(
  terms: TermsFields,
  account: Pick<AccountFields, "certIdx">,
) {
  return terms.service && terms.privacy && account.certIdx !== null;
}
