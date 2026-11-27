import type { ProposalStatus } from "./proposal";

/** 대화 한 줄. 삭제된 메시지는 트랜스포머가 뺌. */
export interface ProposalMessage {
  key: string;
  body: string;
  /** 광고주(나)가 보낸 메시지. */
  isMine: boolean;
  /** ISO. 서버가 못 읽으면 null. */
  writtenAt: string | null;
}

/** 지금 라운드의 제안 카드. */
export interface ProposalOffer {
  campaignName: string;
  campaignType: string | null;
  status: ProposalStatus | null;
  round: number;
  amount: number;
  /** 공구형 캠페인만 값이 있음. */
  groupBuyFeeRate: number | null;
  uploadScheduleStart: string | null;
  uploadScheduleEnd: string | null;
}

export interface ProposalConversation {
  messages: ProposalMessage[];
  offer: ProposalOffer | null;
}

/** 오른쪽 크리에이터 정보 패널. */
export interface ProposalInfo {
  creator: {
    platformIdx: number;
    handle: string;
    nickname: string | null;
    profileImageUrl: string | null;
  };
  campaign: {
    name: string;
    type: string | null;
    /** 서버 표시 문구 그대로(코드 요청 중, B-27). */
    progressStatus: string | null;
    startDate: string | null;
    endDate: string | null;
    code: string | null;
  };
  offer: {
    initialAmount: number;
    currentAmount: number;
    uploadScheduleStart: string | null;
    uploadScheduleEnd: string | null;
  };
  memo: string;
}
