import { Inform } from "@/shared/components/inform";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

import { useIsEditMode } from "../../model/edit-mode";
import { useCampaignRegisterStore } from "../../model/store-context";
import { EditLockedFieldset } from "../EditLockedFieldset";
import { EditLockNotice } from "../EditLockNotice";
import { HeadcountField } from "./conditions/HeadcountField";
import { PostingPeriodField } from "./conditions/PostingPeriodField";
import { RewardField } from "./conditions/RewardField";
import { SecondaryCopyrightField } from "./conditions/SecondaryCopyrightField";

// PC(≥1440) 두 열 안의 행 위치(Tailwind가 클래스를 찾을 수 있게 정적으로 둠).
const ROW_START = ["desktop:row-start-1", "desktop:row-start-2"] as const;

// 6단계 진행 조건 설정(Figma PICK형 7555:334613, 모집형 7816:292237, 구매리뷰형 7803:325894·7816:293767).
// DOM 순서는 TAB·MO(1열) 시안 순서(진행 인원 → 유지기간 → 2차 저작권 → 리워드)이고, PC는 왼쪽 열(진행 인원·유지기간)과 오른쪽 열(2차 저작권·리워드)로 나눔.
// 칸은 유형별로 다름: 진행 인원(모집형), 유지기간·2차 저작권(구매리뷰형 제외), 리워드(모집형 제품발송형·구매리뷰형).
// PICK형 구매리뷰형은 입력할 것이 없어 안내만 보임(스펙 D-9, 시안 대기).
export function ConditionsStep() {
  const { t } = useTranslation("features/register-campaign");
  const serviceType = useCampaignRegisterStore(
    (state) => state.draft.serviceType,
  );
  const campaignType = useCampaignRegisterStore(
    (state) => state.draft.campaignInfo.campaignType,
  );
  const isEditMode = useIsEditMode();
  const isRecruit = serviceType === "RECRUIT";
  const isPurchaseReview = campaignType === "PURCHASE_REVIEW";
  const hasReward =
    isRecruit && (campaignType === "PRODUCT_DELIVERY" || isPurchaseReview);

  if (!isRecruit && isPurchaseReview) {
    return (
      <Inform
        variant="filled"
        title={t("conditions.empty.title")}
        items={[{ id: "empty", text: t("conditions.empty.body") }]}
      />
    );
  }

  const left = [
    isRecruit && (
      <EditLockedFieldset key="headcount" isLocked={isEditMode}>
        <HeadcountField />
      </EditLockedFieldset>
    ),
    !isPurchaseReview && <PostingPeriodField key="period" />,
  ].filter(Boolean);
  const right = [
    !isPurchaseReview && <SecondaryCopyrightField key="copyright" />,
    hasReward && (
      <EditLockedFieldset key="reward" isLocked={isEditMode}>
        <RewardField />
      </EditLockedFieldset>
    ),
  ].filter(Boolean);

  // 왼쪽 열 항목이 먼저, 오른쪽 열 항목이 뒤에 오는 DOM 순서를 TAB·MO 시안 순서(진행 인원 → 유지기간 → 2차 저작권 → 리워드)로 유지함.
  const cells = [
    ...left.map((node, index) => ({ node, column: 1, row: index })),
    ...right.map((node, index) => ({ node, column: 2, row: index })),
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 수정 모드의 인원·리워드 칸은 읽기 전용이라 그 이유를 카드 위에서 알림. */}
      {isEditMode && isRecruit && <EditLockNotice kind="amount" />}
      <div className="grid grid-cols-1 gap-4 rounded-lg border bg-card p-4 tablet:p-5 desktop:grid-cols-2 desktop:gap-x-6 desktop:p-6">
        {cells.map(({ node, column, row }, index) => (
          <div
            key={index}
            className={cn(
              "min-w-0",
              column === 1 ? "desktop:col-start-1" : "desktop:col-start-2",
              ROW_START[row],
            )}
          >
            {node}
          </div>
        ))}
      </div>
    </div>
  );
}
