import { z } from "zod";

// V3 Swagger `V3-마이페이지`(2026-10-22)의 스키마를 기준으로 함. 서버 필드명은 이 파일과
// 트랜스포머 안에서만 쓰고, UI는 아래 뷰모델만 봄.

/** 성공·실패를 `result`로만 알리는 응답(`SimpleResultResponse`). */
export const simpleResultSchema = z.object({ result: z.boolean() });

/**
 * 계좌·업로드처럼 항상 HTTP 200으로 오는 응답. 정산 기간 거부는
 * `{ result: true, reason: "denied" }`라서 `reason`도 함께 읽음.
 */
export const resultWithReasonSchema = z.object({
  result: z.boolean(),
  reason: z.string().nullish(),
});

/** 비 2xx 응답 본문(`V3ErrorResponse`). */
export const v3ErrorSchema = z.object({
  result: z.literal(false),
  reason: z.string(),
});

const certificationSchema = z.object({
  certIdx: z.number(),
  name: z.string(),
  phoneNumber: z.string(),
});

const masterUserSchema = z.object({
  identifier: z.string(),
  email: z.string().nullish(),
  certification: certificationSchema.nullish(),
  created: z.string().nullish(),
  // 간편 로그인 연동 상태. 연동하지 않았으면 null.
  idKakao: z.string().nullish(),
  idNaver: z.string().nullish(),
  idFacebook: z.string().nullish(),
  idGoogle: z.string().nullish(),
  idApple: z.string().nullish(),
  emailKakao: z.string().nullish(),
  emailNaver: z.string().nullish(),
  emailFacebook: z.string().nullish(),
  emailGoogle: z.string().nullish(),
  emailApple: z.string().nullish(),
});

const masterExtraInformationSchema = z.object({
  companyName: z.string().nullish(),
  contact: z.string().nullish(),
  companyRegistrationNumber: z.string().nullish(),
  mailorderBusinessNumber: z.string().nullish(),
  companyClassification: z.number().nullish(),
  companyClassificationName: z.string().nullish(),
  // 첨부파일 인덱스. 업로드하지 않았으면 null.
  companyRegistrationFileNum: z.number().nullish(),
  // 서류 원본 파일명(확장자 포함). 업로드하지 않았으면 null.
  companyRegistrationFileName: z.string().nullish(),
  mailorderBusinessFileNum: z.number().nullish(),
  mailorderBusinessFileName: z.string().nullish(),
  bankBookFileNum: z.number().nullish(),
  companyUrl: z.string().nullish(),
});

/** `GET /v3/mypage/account/master`. SUB는 403이라 MASTER·ADMIN만 호출함. */
export const accountMasterSchema = z.object({
  result: z.boolean(),
  user: masterUserSchema,
  // 회사정보를 등록하기 전에는 비어 있을 수 있어 nullish로 받음(Swagger는 필수로 표기).
  extraInformation: masterExtraInformationSchema.nullish(),
});
export type AccountMaster = z.infer<typeof accountMasterSchema>;

export const SOCIAL_PROVIDERS = [
  "kakao",
  "naver",
  "facebook",
  "google",
  "apple",
] as const;
export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

export interface SocialLinkViewModel {
  isLinked: boolean;
  /** 연동한 SNS 계정의 이메일. 없으면 null. */
  email: string | null;
}

export interface AccountProfileViewModel {
  identifier: string;
  /** 담당자명(본인인증 실명). */
  name: string;
  phone: string;
  email: string;
  joinedAt: Date | null;
  /** 현재 연결된 본인인증 인덱스. 휴대폰을 바꾸지 않을 때 `PUT /modify`에 다시 보냄. */
  certIdx: number | null;
}

/** 회사정보 폼의 초기값. 서류는 인덱스가 아니라 등록 여부와 파일명만 UI가 봄. */
export interface CompanyInfoViewModel {
  companyName: string;
  contact: string;
  businessNumber: string;
  mailorderNumber: string;
  /** 회사 분류 인덱스. 선택하지 않았으면 null. */
  categoryIdx: number | null;
  categoryName: string | null;
  companyUrl: string;
  hasBusinessRegistrationFile: boolean;
  /** 등록된 사업자 등록증의 원본 파일명. 서버가 이름을 주지 않으면 null. */
  businessRegistrationFileName: string | null;
  hasMailorderFile: boolean;
  mailorderFileName: string | null;
  hasBankBookFile: boolean;
}

export interface MasterAccountViewModel {
  profile: AccountProfileViewModel;
  /** 회사정보를 아직 등록하지 않았으면 null. `POST`(등록)와 `PUT`(수정)을 가르는 기준. */
  company: CompanyInfoViewModel | null;
  socialLinks: Record<SocialProvider, SocialLinkViewModel>;
}
