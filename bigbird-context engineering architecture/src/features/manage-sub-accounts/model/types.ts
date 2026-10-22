export interface SubAccountViewModel {
  /** 서버가 주는 Sub ID 인덱스. 권한 부여·삭제의 대상 키. */
  accountIdx: number;
  /** 로그인 아이디. */
  identifier: string;
  /** 담당자명. */
  name: string;
  email: string;
  createdAt: Date;
}

/** Sub ID에 부여하는 메뉴 권한 한 항목. 항목 목록·순서는 서버가 정함(스펙 §3). */
export interface SubAccountPermission {
  /** 서버가 주는 권한 코드. 번역 키로 쓰고, 모르는 코드는 서버 이름을 그대로 보임. */
  key: string;
  /** 서버가 준 표시 이름. 번역 키가 없을 때 대신 보임. */
  name: string;
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
