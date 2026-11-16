import type { CampaignSummary } from "@/entities/campaign";

/** 행의 "바로 가기" 버튼. 문구는 종류마다 정해져 있음(스펙 §3 표). */
export type ShortcutKind =
  "write" | "detail" | "rejectReason" | "manage" | "result";

/** 행 오른쪽 아이콘 버튼. 등록 중만 삭제이고 나머지는 기본 정보(등록 내역)를 엶. */
export type IconActionKind = "delete" | "detail";

interface RowActions {
  shortcut: ShortcutKind | null;
  iconAction: IconActionKind | null;
}

const SHORTCUT_BY_STAGE = {
  DRAFT: "write",
  REVIEWING: "detail",
  REJECTED: "rejectReason",
  IN_PROGRESS: "manage",
  ENDED: "result",
} as const;

/**
 * 진행 단계(와 데모 여부)로 정해지는 바로 가기·아이콘. 할당된 Sub ID는 "작성하기"·삭제를 쓰지 못해 숨김(사용자 결정, 스펙 P-3).
 * 모르는 진행 단계는 등록 내역으로 둠. 작성을 마친 데모는 "작성하기" 대신 "등록 내역"(조회만).
 */
export function getRowActions(
  campaign: Pick<CampaignSummary, "stage" | "isDemoCompleted">,
  { isSubAccount }: { isSubAccount: boolean },
): RowActions {
  const stage = campaign.stage;
  const isDraft = stage === "DRAFT";
  const shortcut: ShortcutKind =
    stage === null
      ? "detail"
      : isDraft && campaign.isDemoCompleted
        ? "detail"
        : SHORTCUT_BY_STAGE[stage];
  const iconAction: IconActionKind = isDraft ? "delete" : "detail";

  return {
    shortcut: shortcut === "write" && isSubAccount ? null : shortcut,
    iconAction: iconAction === "delete" && isSubAccount ? null : iconAction,
  };
}
