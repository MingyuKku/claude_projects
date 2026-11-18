import { INQUIRY_SOURCE_TYPE } from "@/entities/inquiry";
import { ROUTES } from "@/shared/config";

import type {
  BuyerInquirySource,
  InquiryFilterSourceType,
} from "@/entities/inquiry";

/** 같은 화면을 쓰는 고객센터 메뉴. 인플루언서 문의는 구매자 문의 레이아웃을 그대로 씀(REQ-34-0001). */
export type InquiryMenu = "buyer" | "influencer";

export const INQUIRY_MENU = {
  buyer: {
    sources: ["purchaser", "qna"],
    filterSourceType: INQUIRY_SOURCE_TYPE.purchaser,
    listRoute: ROUTES.customerCenterBuyer,
    threadRoute: ROUTES.customerCenterBuyerThread,
  },
  influencer: {
    sources: ["influencer", "campaignQna"],
    filterSourceType: INQUIRY_SOURCE_TYPE.influencer,
    listRoute: ROUTES.customerCenterInfluencer,
    threadRoute: ROUTES.customerCenterInfluencerThread,
  },
} as const satisfies Record<
  InquiryMenu,
  {
    sources: readonly BuyerInquirySource[];
    /** 필터의 캠페인·인플루언서 목록 API에 보내는 출처. */
    filterSourceType: InquiryFilterSourceType;
    listRoute: string;
    threadRoute: string;
  }
>;

/** 출처가 속한 메뉴. */
export function toInquiryMenu(source: BuyerInquirySource): InquiryMenu {
  return source === "influencer" || source === "campaignQna"
    ? "influencer"
    : "buyer";
}

/** Q&A(질문 1건 + 답변)로 여는 출처. 나머지는 스레드 대화. */
export function isQnaSource(source: BuyerInquirySource) {
  return source === "qna" || source === "campaignQna";
}
