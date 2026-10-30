// 임시 목 데이터(스펙 §1·§7 B-3·B-6). 캠페인 할당의 진행 상태 기준이 확정되면(docs/mypage-api.md §4-5) 지움.
// 코드값(productType·detailType·status)은 임시. 개발 서버에서만 채우고 빌드(stage·prod)에서는 빈 목록이라 번들에 목 값이 들어가지 않음.
import type { CampaignAssignment } from "./types";

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
