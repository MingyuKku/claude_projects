import type {
  AccountMaster,
  CompanyInfoViewModel,
  AccountProfileViewModel,
  MasterAccountViewModel,
  SubSelfAccount,
} from "../model/mypage-schema";

/** 서버 날짜 형식은 `yyyy-MM-dd HH:mm`(시간대 표기 없음). 로컬 시각으로 읽음. */
export function parseServerDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toCompanyInfo(
  company: NonNullable<AccountMaster["companyInformation"]>,
): CompanyInfoViewModel {
  return {
    companyName: company.companyName ?? "",
    contact: company.contact ?? "",
    businessNumber: company.companyRegistrationNumber ?? "",
    mailorderNumber: company.mailorderBusinessNumber ?? "",
    categoryIdx: company.companyClassification ?? null,
    categoryName: company.companyClassificationName ?? null,
    companyUrl: company.companyUrl ?? "",
    hasBusinessRegistrationFile: company.companyRegistrationFileNum != null,
    businessRegistrationFileName: company.companyRegistrationFileName || null,
    hasMailorderFile: company.mailorderBusinessFileNum != null,
    mailorderFileName: company.mailorderBusinessFileName || null,
    hasBankBookFile: company.bankBookFileNum != null,
  };
}

export function transformMasterToViewModel(
  master: AccountMaster,
): MasterAccountViewModel {
  const { user, companyInformation } = master;
  return {
    profile: {
      identifier: user.identifier,
      name: user.certification?.name ?? "",
      phone: user.certification?.phoneNumber ?? "",
      email: user.email ?? "",
      joinedAt: parseServerDate(user.created),
      certIdx: user.certification?.certIdx ?? null,
    },
    company: companyInformation ? toCompanyInfo(companyInformation) : null,
  };
}

/** Sub ID 본인 정보. 응답에 가입일이 없어 비워 두고, Sub는 본인인증을 쓰지 않아 `certIdx`가 없음. */
export function transformSubSelfToViewModel(
  account: SubSelfAccount,
): AccountProfileViewModel {
  return {
    identifier: account.identifier,
    name: account.name,
    phone: account.phone,
    email: account.email,
    joinedAt: null,
    certIdx: null,
  };
}
