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
});

const masterCompanyInformationSchema = z.object({
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
  companyInformation: masterCompanyInformationSchema.nullish(),
});
export type AccountMaster = z.infer<typeof accountMasterSchema>;

/** `GET /v3/mypage/account/sub/self`. SUB 전용(MASTER·ADMIN은 403). */
export const subSelfAccountSchema = z.object({
  accountIdx: z.number(),
  identifier: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  // Sub 본인 이미지. `GET /profile`은 회사(Master) 기준이라 Sub 이미지는 여기서만 읽음(2026-11-03 백엔드 확인).
  profileImageUrl: z.string().nullish(),
  // Sub 계정 생성일시(`yyyy-MM-dd HH:mm`, Master `user.created`와 같은 형식). 2026-11-03 Stage 추가.
  created: z.string().nullish(),
});
export type SubSelfAccount = z.infer<typeof subSelfAccountSchema>;

/** 간편 로그인 연동 대상. 페이스북은 연동하지 않음(사용자 결정 2026-10-29). */
export const SOCIAL_PROVIDERS = ["kakao", "naver", "google", "apple"] as const;
export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

export interface SocialLinkViewModel {
  isLinked: boolean;
  /** 연동한 SNS 계정의 이메일. 없으면 null. */
  email: string | null;
}

/**
 * `GET·POST·DELETE /v3/mypage/account/sns[/{platform}]`의 응답(`AccountSnsListV3Response`).
 * kakao·naver·google·apple 순서로 항상 4개(2026-11-02 Stage Swagger). 모르는 플랫폼은 트랜스포머가 버림.
 */
export const accountSnsListSchema = z.object({
  items: z.array(
    z.object({
      platform: z.string(),
      linked: z.boolean(),
      email: z.string().nullish(),
    }),
  ),
});
export type AccountSnsList = z.infer<typeof accountSnsListSchema>;

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

/** Sub ID 본인 정보. Master와 달리 프로필 이미지가 본인 정보 응답에 함께 옴. */
export interface SubSelfAccountViewModel {
  profile: AccountProfileViewModel;
  /** 등록한 적이 없으면 null. */
  profileImageUrl: string | null;
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
}
