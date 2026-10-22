import { SOCIAL_PROVIDERS } from "../model/mypage-schema";

import type {
  AccountMaster,
  CompanyInfoViewModel,
  MasterAccountViewModel,
  SocialLinkViewModel,
  SocialProvider,
} from "../model/mypage-schema";

/** 서버 날짜 형식은 `yyyy-MM-dd HH:mm`(시간대 표기 없음). 로컬 시각으로 읽음. */
export function parseServerDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toSocialLinks(user: AccountMaster["user"]) {
  const ids: Record<SocialProvider, string | null | undefined> = {
    kakao: user.idKakao,
    naver: user.idNaver,
    facebook: user.idFacebook,
    google: user.idGoogle,
    apple: user.idApple,
  };
  const emails: Record<SocialProvider, string | null | undefined> = {
    kakao: user.emailKakao,
    naver: user.emailNaver,
    facebook: user.emailFacebook,
    google: user.emailGoogle,
    apple: user.emailApple,
  };
  const links = {} as Record<SocialProvider, SocialLinkViewModel>;
  for (const provider of SOCIAL_PROVIDERS) {
    links[provider] = {
      isLinked: Boolean(ids[provider]),
      email: emails[provider] || null,
    };
  }
  return links;
}

function toCompanyInfo(
  extra: NonNullable<AccountMaster["extraInformation"]>,
): CompanyInfoViewModel {
  return {
    companyName: extra.companyName ?? "",
    contact: extra.contact ?? "",
    businessNumber: extra.companyRegistrationNumber ?? "",
    mailorderNumber: extra.mailorderBusinessNumber ?? "",
    categoryIdx: extra.companyClassification ?? null,
    categoryName: extra.companyClassificationName ?? null,
    companyUrl: extra.companyUrl ?? "",
    hasBusinessRegistrationFile: extra.companyRegistrationFileNum != null,
    businessRegistrationFileName: extra.companyRegistrationFileName || null,
    hasMailorderFile: extra.mailorderBusinessFileNum != null,
    mailorderFileName: extra.mailorderBusinessFileName || null,
    hasBankBookFile: extra.bankBookFileNum != null,
  };
}

export function transformMasterToViewModel(
  master: AccountMaster,
): MasterAccountViewModel {
  const { user, extraInformation } = master;
  return {
    profile: {
      identifier: user.identifier,
      name: user.certification?.name ?? "",
      phone: user.certification?.phoneNumber ?? "",
      email: user.email ?? "",
      joinedAt: parseServerDate(user.created),
      certIdx: user.certification?.certIdx ?? null,
    },
    company: extraInformation ? toCompanyInfo(extraInformation) : null,
    socialLinks: toSocialLinks(user),
  };
}
