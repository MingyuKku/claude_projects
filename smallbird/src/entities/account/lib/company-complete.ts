import type { CompanyInfoViewModel } from "../model/mypage-schema";

/**
 * 회사정보 필수 6개(회사명·연락처·사업자 등록 번호·사업자 등록증·통신판매번호·통신판매업 신고증)가
 * 모두 등록돼 있는지. 계좌정보는 이 조건을 만족해야 다룰 수 있음(통장사본 업로드 API도 회사정보를 전제함).
 */
export function isCompanyInfoComplete(company: CompanyInfoViewModel | null) {
  if (!company) return false;
  return (
    [
      company.companyName,
      company.contact,
      company.businessNumber,
      company.mailorderNumber,
    ].every((value) => value.trim() !== "") &&
    company.hasBusinessRegistrationFile &&
    company.hasMailorderFile
  );
}
