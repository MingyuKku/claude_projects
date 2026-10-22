// 임시 목 데이터(스펙 §1·§7 B-3·B-6). 권한·캠페인 할당 API가 공개되고 코드(enum)가 확정되면 지움.
// 코드값(key·productType·detailType·status)은 임시이고, 권한은 스펙의 6개(빅버드 머니 포함)를 따름.
// 개발 서버에서만 채우고 빌드(stage·prod)에서는 빈 목록이라 번들에 목 값이 들어가지 않음.
import type { CampaignAssignment, SubAccountPermission } from "./types";

export const MOCK_PERMISSIONS: SubAccountPermission[] = import.meta.env.DEV
  ? [
      { key: "campaign", name: "캠페인", isGranted: false },
      { key: "influencerMatching", name: "인플루언서 매칭", isGranted: true },
      { key: "influencerMarket", name: "인플루언서 마켓", isGranted: true },
      { key: "commerce", name: "커머스 관리", isGranted: false },
      { key: "buyerInquiry", name: "구매자 문의", isGranted: false },
      { key: "bigbirdMoney", name: "빅버드 머니", isGranted: false },
    ]
  : [];
export const MOCK_CAMPAIGN_ASSIGNMENTS: CampaignAssignment[] = import.meta.env
  .DEV
  ? [
      {
        campaignIdx: 7001,
        name: "2024 여름 신상 프로모션",
        productType: "recruit",
        detailType: "brand",
        status: "completed",
        isAssigned: false,
      },
      {
        campaignIdx: 7002,
        name: "클린 뷰티 브랜드 캠페인",
        productType: "recruit",
        detailType: "brand",
        status: "waiting",
        isAssigned: true,
      },
      {
        campaignIdx: 7003,
        name: "신학기 패션 브랜드 특별전",
        productType: "pick",
        detailType: "groupBuy",
        status: "running",
        isAssigned: false,
      },
      {
        campaignIdx: 7004,
        name: "프리미엄 가전 브랜드 캠페인",
        productType: "recruit",
        detailType: "brand",
        status: "completed",
        isAssigned: true,
      },
      {
        campaignIdx: 7005,
        name: "F&B 신제품 브랜드 기획전 F&B 신제품 브랜드 기획전 F&B 신제품 브랜드 기획전",
        productType: "pick",
        detailType: "groupBuy",
        status: "completed",
        isAssigned: false,
      },
    ]
  : [];
