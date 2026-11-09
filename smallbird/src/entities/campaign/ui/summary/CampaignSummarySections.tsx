import {
  SummaryEditContext,
  SummaryRejectionContext,
} from "./rejection-context";
import { CampaignInfoSection } from "./sections/CampaignInfoSection";
import {
  ConditionsSection,
  PaymentSection,
  PolicySection,
} from "./sections/ConditionsPolicyPaymentSections";
import {
  AddOnsSection,
  InfluencerSection,
} from "./sections/InfluencerAddOnSections";
import { IntroSection } from "./sections/IntroSection";
import { ProductSection } from "./sections/ProductSection";

import type { CampaignSection } from "../../model/codes";
import type { CampaignDetail } from "../../model/schema";

/** 섹션 카드의 id. 사이드바가 이 id로 스크롤함. */
export function summarySectionId(index: number) {
  return `campaign-summary-section-${index}`;
}

interface CampaignSummarySectionsProps {
  campaign: CampaignDetail;
  /** "수정"을 보일 섹션(반려된 섹션 중 고칠 수 있는 것). 없으면 수정 버튼이 없음. */
  editableSections?: readonly CampaignSection[];
  onEdit?: (section: CampaignSection) => void;
}

// 등록 내역(기본 정보)의 섹션 카드 8개(Figma 7555:334011). 모두 읽기 전용이고, 승인 상태가 정하는 배너·"수정"은 쓰는 화면이 얹음.
// 섹션은 배열 순서가 곧 번호라 모집형 전용 섹션(스펙 P-21)이 생기면 여기에 항목만 더함.
export function CampaignSummarySections({
  campaign,
  editableSections = [],
  onEdit,
}: CampaignSummarySectionsProps) {
  const sections = [
    CampaignInfoSection,
    ProductSection,
    InfluencerSection,
    AddOnsSection,
    IntroSection,
    ConditionsSection,
    PolicySection,
    PaymentSection,
  ];

  // 반려 상태일 때만 반려된 섹션에 사유를 보임(다른 상태에는 반려 기록이 남아 있어도 보이지 않음).
  const rejections = new Map(
    campaign.status === "REJECTED"
      ? campaign.rejections.map((r) => [r.section, r.reason] as const)
      : [],
  );

  return (
    <SummaryRejectionContext value={rejections}>
      <SummaryEditContext
        value={
          onEdit
            ? { editableSections: new Set(editableSections), onEdit }
            : null
        }
      >
        <div className="flex flex-col gap-4">
          {sections.map((Section, index) => (
            <Section
              key={index}
              campaign={campaign}
              id={summarySectionId(index + 1)}
            />
          ))}
        </div>
      </SummaryEditContext>
    </SummaryRejectionContext>
  );
}
