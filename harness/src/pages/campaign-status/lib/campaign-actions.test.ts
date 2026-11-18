import { getRowActions } from "./campaign-actions";

import type { CampaignStage } from "@/entities/campaign";

function actionsOf(
  stage: CampaignStage | null,
  options: { isSubAccount?: boolean; isDemoCompleted?: boolean } = {},
) {
  return getRowActions(
    { stage, isDemoCompleted: options.isDemoCompleted ?? false },
    { isSubAccount: options.isSubAccount ?? false },
  );
}

describe("getRowActions", () => {
  it.each([
    ["DRAFT", "write", "delete"],
    ["REVIEWING", "detail", "detail"],
    ["REJECTED", "rejectReason", "detail"],
    ["IN_PROGRESS", "manage", "detail"],
    ["ENDED", "result", "detail"],
  ] as const)(
    "%s 단계는 바로 가기 %s, 아이콘 %s",
    (stage, shortcut, iconAction) => {
      expect(actionsOf(stage)).toEqual({ shortcut, iconAction });
    },
  );

  it("작성을 마친 데모도 작성하기·삭제다(작성 화면이 기본 정보로 보냄, 데모 시안 3.0.0)", () => {
    expect(actionsOf("DRAFT", { isDemoCompleted: true })).toEqual({
      shortcut: "write",
      iconAction: "delete",
    });
  });

  it("모르는 진행 단계는 등록 내역을 연다", () => {
    expect(actionsOf(null)).toEqual({
      shortcut: "detail",
      iconAction: "detail",
    });
  });

  it("할당된 Sub ID는 작성하기와 삭제를 쓰지 못하고 조회는 할 수 있다", () => {
    expect(actionsOf("DRAFT", { isSubAccount: true })).toEqual({
      shortcut: null,
      iconAction: null,
    });
    expect(
      actionsOf("DRAFT", { isSubAccount: true, isDemoCompleted: true }),
    ).toEqual({ shortcut: "detail", iconAction: null });
    expect(actionsOf("REJECTED", { isSubAccount: true })).toEqual({
      shortcut: "rejectReason",
      iconAction: "detail",
    });
  });
});
