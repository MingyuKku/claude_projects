import type { PERMISSION_FIELDS } from "./constants";

export interface SubAccountViewModel {
  /** 서버가 주는 Sub ID 인덱스. 권한 부여·삭제의 대상 키. */
  accountIdx: number;
  /** 로그인 아이디. */
  identifier: string;
  /** 담당자명. */
  name: string;
  email: string;
  /** 프로필 이미지 주소. 이미지가 없으면 null(기본 아바타). */
  profileImageUrl: string | null;
  /** 서버가 생성일을 주지 않으면 null. */
  createdAt: Date | null;
}

/** Sub ID 목록 한 쪽. */
export interface SubAccountPageViewModel {
  accounts: SubAccountViewModel[];
  totalCount: number;
  page: number;
  totalPages: number;
}

/** 서버에 저장할 수 있는 권한(API가 나온 것만). */
export type ApiPermissionKey = keyof typeof PERMISSION_FIELDS;

/** Sub ID에 부여하는 메뉴 권한 한 항목. 서버가 주는 권한만 그림(스펙 §3). */
export interface SubAccountPermission {
  key: ApiPermissionKey;
  isGranted: boolean;
}

export interface SubAccountPermissionChange {
  key: ApiPermissionKey;
  isGranted: boolean;
}

/** Sub ID 캠페인 할당 표의 한 행. 상품 유형·세부 상품·진행 상태는 서버 코드(번역 키)이고 캠페인명은 사용자 콘텐츠라 그대로 보임. */
export interface CampaignAssignment {
  campaignIdx: number;
  name: string;
  productType: string;
  detailType: string;
  status: string;
  /** 이 Sub ID가 담당하는지. */
  isAssigned: boolean;
}
