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

/** Sub ID는 작성하기를 못 쓰지만 작성을 마친 데모는 조회할 수 있어 "등록 내역"으로 바꿈. */
function toSubAccountShortcut(isDemoCompleted: boolean): ShortcutKind | null {
  return isDemoCompleted ? "detail" : null;
}

/**
 * 할당된 Sub ID는 "작성하기"·삭제를 쓰지 못해 숨김. 모르는 진행 단계는 등록 내역으로 둠.
 * 작성을 마친 데모도 "작성하기"이고 기본 정보로 감(이동은 화면이 정함).
 */
export function getRowActions(
  campaign: Pick<CampaignSummary, "stage" | "isDemoCompleted">,
  { isSubAccount }: { isSubAccount: boolean },
): RowActions {
  const stage = campaign.stage;
  const isDraft = stage === "DRAFT";
  const shortcut: ShortcutKind =
    stage === null ? "detail" : SHORTCUT_BY_STAGE[stage];
  const iconAction: IconActionKind = isDraft ? "delete" : "detail";
  const isBlockedWrite = shortcut === "write" && isSubAccount;

  return {
    shortcut: isBlockedWrite
      ? toSubAccountShortcut(campaign.isDemoCompleted)
      : shortcut,
    iconAction: iconAction === "delete" && isSubAccount ? null : iconAction,
  };
}
