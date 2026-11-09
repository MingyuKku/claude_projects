import { getCampaignStepModels } from "./step-definitions";
import { useCampaignRegisterStore } from "./store-context";

import type { CampaignSection } from "@/entities/campaign";

/**
 * 반려 후 수정 모드인지. 반려된 캠페인은 결제를 유지한 채 반려된 단계만 고쳐 재승인을 요청함(스펙 P-19).
 * 작성 경로의 `step`이 있을 때만 작성 화면이 열리므로(`resolveRegisterEntry`) 반려 상태면 곧 수정 모드임.
 */
export function useIsEditMode() {
  return useCampaignRegisterStore((state) => state.draft.status === "REJECTED");
}

/** 결제 금액에 영향을 주는 값이라 수정 모드에서 고칠 수 없는 섹션. 6단계는 인원·리워드 칸만 잠그고 나머지는 고칠 수 있어서 여기에 넣지 않음. */
const AMOUNT_LOCKED_SECTIONS: readonly CampaignSection[] = ["ADD_ONS"];

/**
 * 수정 모드에서 고칠 수 없는 섹션인지(스펙 §3 등록 내역). 이미 동의·결제한 7·8단계(단계 정의의 `isLockedInEdit`)와
 * 결제 금액에 영향을 주는 4단계 부가서비스임.
 */
export function isSectionLockedInEdit(section: CampaignSection) {
  if (AMOUNT_LOCKED_SECTIONS.includes(section)) return true;
  return Boolean(
    getCampaignStepModels("PICK").find((step) => step.section === section)
      ?.isLockedInEdit,
  );
}
