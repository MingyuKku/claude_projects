import type { ExtraInformationBody } from "../api/company-api";
import type { CompanyInfoViewModel } from "@/entities/account";

export interface CompanyFormValues {
  companyName: string;
  contact: string;
  businessNumber: string;
  mailorderNumber: string;
  /** 선택한 회사 분류 인덱스(문자열). 선택하지 않았으면 빈 문자열. */
  categoryIdx: string;
  companyUrl: string;
}

export interface CompanyFormFiles {
  businessRegistration: File | null;
  mailorderReport: File | null;
}

export const EMPTY_FILES: CompanyFormFiles = {
  businessRegistration: null,
  mailorderReport: null,
};

export function toCompanyFormValues(
  company: CompanyInfoViewModel | null,
): CompanyFormValues {
  return {
    companyName: company?.companyName ?? "",
    contact: company?.contact ?? "",
    businessNumber: company?.businessNumber ?? "",
    mailorderNumber: company?.mailorderNumber ?? "",
    categoryIdx:
      company?.categoryIdx != null ? String(company.categoryIdx) : "",
    companyUrl: company?.companyUrl ?? "",
  };
}

/**
 * 필수 6개(회사명·연락처·사업자 등록 번호·사업자 등록증·통신판매번호·통신판매업 신고증)가
 * 모두 채워졌는지. 서류는 이미 등록돼 있거나 이번에 고른 파일이 있으면 채운 것으로 봄.
 */
export function isCompanyFormComplete(
  values: CompanyFormValues,
  files: CompanyFormFiles,
  company: CompanyInfoViewModel | null,
) {
  const hasTexts = [
    values.companyName,
    values.contact,
    values.businessNumber,
    values.mailorderNumber,
  ].every((value) => value.trim() !== "");
  const hasRegistration =
    files.businessRegistration !== null ||
    Boolean(company?.hasBusinessRegistrationFile);
  const hasMailorderReport =
    files.mailorderReport !== null || Boolean(company?.hasMailorderFile);
  return hasTexts && hasRegistration && hasMailorderReport;
}

/** 비어 있는 선택 항목은 보내지 않음(수정 API가 전체 덮어쓰기라 서버에서 비워짐). */
export function toExtraInformationBody(
  values: CompanyFormValues,
): ExtraInformationBody {
  return {
    companyName: values.companyName.trim(),
    contact: values.contact.trim(),
    companyRegistrationNumber: values.businessNumber.trim(),
    mailorderBusinessNumber: values.mailorderNumber.trim(),
    category: values.categoryIdx ? Number(values.categoryIdx) : undefined,
    companyUrl: values.companyUrl.trim() || undefined,
  };
}
