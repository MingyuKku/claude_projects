import { tryit } from "radash";

import { CAMPAIGN_DRAFT_STEPS, saveCampaignStep } from "@/entities/campaign";
import { readApiErrorReason } from "@/shared/api";

import { uploadPendingIntroMedia } from "./pending-media";
import { isStepChanged } from "./store";

import type { RegisterWizardState, RegisterWizardStoreApi } from "./store";
import type { CampaignDraftStep } from "@/entities/campaign";

// 단계별 저장(A-5.x). 바뀐 단계만 한 번에 하나씩 보내고, 보내는 동안 생긴 변경은 끝난 뒤 이어서 보냄(스펙 §3 저장).

export type SaveResult =
  | { ok: true }
  | {
      ok: false;
      reason: string | undefined;
      /** 5단계 파일 올리기에서 실패함. 형식·용량 안내 문구를 고르려고 구분함. */
      isUploadFailure?: boolean;
    };

/** 유형을 바꾸면 서버가 비우는 단계(A-5.1). */
const STEPS_CLEARED_BY_TYPE_CHANGE: readonly CampaignDraftStep[] = [
  "product",
  "influencer",
  "addOns",
  "intro",
  "conditions",
];

/** 보낼 단계: 마지막으로 저장한 값과 달라진 단계. */
export function getChangedSteps(
  state: Pick<RegisterWizardState, "draft" | "savedDraft">,
): CampaignDraftStep[] {
  return CAMPAIGN_DRAFT_STEPS.filter((step) => isStepChanged(state, step));
}

export interface DraftSaver {
  save: () => Promise<SaveResult>;
  hasChanges: () => boolean;
}

/** `onSaved`(상세 캐시 갱신)가 끝난 뒤에 저장 완료로 알림. 저장 직후 화면을 옮기는 쪽이 새 값을 읽게 하려고. */
export function createDraftSaver(
  store: RegisterWizardStoreApi,
  onSaved: () => Promise<unknown>,
): DraftSaver {
  let queue: Promise<SaveResult> = Promise.resolve({ ok: true });

  async function saveChangedSteps(): Promise<SaveResult> {
    let hasSaved = false;
    for (;;) {
      let state = store.getState();
      const [step] = getChangedSteps(state);
      if (!step) break;
      if (step === "intro") {
        const uploaded = await uploadPendingIntroMedia(store);
        if (!uploaded.ok) return { ...uploaded, isUploadFailure: true };
        // 올리는 사이 파일을 지워 저장할 것이 없어졌을 수 있어 다시 판단함.
        if (!isStepChanged(store.getState(), step)) continue;
        state = store.getState();
      }
      const snapshot = state.draft;
      const isTypeChanged =
        step === "info" &&
        state.savedDraft.info.campaignType !== null &&
        state.savedDraft.info.campaignType !== snapshot.info.campaignType;
      const [error] = await tryit(saveCampaignStep)(
        state.campaignIdx,
        step,
        snapshot,
      );
      if (error) return { ok: false, reason: readApiErrorReason(error) };
      hasSaved = true;
      store.getState().markSaved(step, snapshot[step]);
      if (isTypeChanged) {
        store.getState().markServerCleared(STEPS_CLEARED_BY_TYPE_CHANGE);
      }
    }
    if (hasSaved) await onSaved();
    return { ok: true };
  }

  return {
    save: () => {
      queue = queue.then(saveChangedSteps, saveChangedSteps);
      return queue;
    },
    hasChanges: () => getChangedSteps(store.getState()).length > 0,
  };
}
