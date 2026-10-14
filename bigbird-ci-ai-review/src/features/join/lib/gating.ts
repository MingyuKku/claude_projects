import type { AccountFields, CompanyFields, TermsFields } from "../model/types";

export type FieldState = "default" | "error" | "success";

/** Error wins over success for borders. */
export function resolveInputState(
  isError: boolean,
  isSuccess: boolean,
): FieldState {
  if (isError) return "error";
  if (isSuccess) return "success";
  return "default";
}

/** Success wins over error for message colors. */
export function resolveMessageClass(isError: boolean, isSuccess: boolean) {
  if (isSuccess) return "text-positive!";
  if (isError) return "text-negative!";
  return "text-gray-400!";
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
