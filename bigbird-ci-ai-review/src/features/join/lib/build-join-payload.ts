import {
  buildMailorderNumber,
  isValidCompanyUrl,
  normalizeCompanyUrl,
} from "@/entities/account";

import type {
  AccountFields,
  CompanyFields,
  JoinPayload,
  TermsFields,
} from "../model/types";

/** Null when the account has not passed identity verification, so nothing can be submitted. */
export function buildJoinPayload(
  account: AccountFields,
  company: CompanyFields,
  terms: TermsFields,
): JoinPayload | null {
  if (account.certIdx === null) return null;

  return {
    id: account.id,
    pw: account.password,
    certIdx: account.certIdx,
    email: account.email,
    termsAgreed: terms.service,
    personalInformationCollectionAgreed: terms.privacy,
    companyName: company.companyName,
    contact: company.companyContact,
    companyRegistrationNumber: company.companyRegistrationNumber,
    mailorderBusinessNumber: buildMailorderNumber(company.mailorderParts),
    classification: company.classification
      ? Number(company.classification)
      : null,
    companyUrl:
      company.companyUrl && isValidCompanyUrl(company.companyUrl)
        ? normalizeCompanyUrl(company.companyUrl)
        : null,
  };
}
