import { PolicyAgreementList } from "./policy/PolicyAgreementList";

// 7단계 캠페인 정책 동의(Figma 7555:334641). 목록은 8단계 약관 동의 카드와 같은 값을 보이려고 따로 뽑아 둠.
export function PolicyStep() {
  return (
    <div className="rounded-lg border bg-card p-4 tablet:p-5 desktop:p-6">
      <PolicyAgreementList idPrefix="policy" />
    </div>
  );
}
