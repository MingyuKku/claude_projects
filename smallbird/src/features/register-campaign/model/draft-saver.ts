import { isEqual, tryit } from "radash";

import { saveCampaignStep } from "@/entities/campaign";
import { readApiErrorReason } from "@/shared/api";

import { applyDraftDefaults } from "./draft-defaults";
import { uploadPendingIntroMedia } from "./pending-media";
import { getRegisterSteps } from "./steps";
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
  "creator",
  "addOns",
  "intro",
  "conditions",
];

/**
 * 보낼 단계: 이 캠페인 유형에 있는 단계 중 마지막으로 저장한 값과 달라진 단계. 정책 동의는 결제 요청에 실어 보내므로
 * 뺌. 없는 단계(브랜드형의 공동구매 조건, 공구형의 진행 조건)는 서버가 거절하거나 받지 않는 값이라 보내지 않음.
 */
export function getChangedSteps(
  state: Pick<
    RegisterWizardState,
    "draft" | "savedDraft" | "serviceType" | "productType" | "shownSteps"
  >,
  { skipUnseenDefaults = false }: SaveOptions = {},
): CampaignDraftStep[] {
  // 저장한 값에 기본 선택을 채운 것과 같으면 다시 들어와도 같은 화면이 되므로, 열지 않은 단계는 미뤄도 보이는 값이 같음.
  const savedWithDefaults = skipUnseenDefaults
    ? applyDraftDefaults(state.savedDraft, { productType: state.productType })
    : null;
  return getRegisterSteps(state.serviceType, state.productType).flatMap(
    ({ draftStep }) => {
      if (draftStep === null || draftStep === "policy") return [];
      if (!isStepChanged(state, draftStep)) return [];
      const isUnseenDefault =
        savedWithDefaults !== null &&
        !state.shownSteps.includes(draftStep) &&
        isEqual(state.draft[draftStep], savedWithDefaults[draftStep]);
      return isUnseenDefault ? [] : [draftStep];
    },
  );
}

export interface SaveOptions {
  /**
   * 열지 않은 단계의 기본 선택은 보내지 않음. 단계 이동·임시저장·떠날 때 사용자가 보지 않은 단계를 미리 저장하느라 늦어지지
   * 않게 하려고 씀. 결제 쪽 저장은 이 옵션 없이 모두 보냄.
   */
  skipUnseenDefaults?: boolean;
}

export interface DraftSaver {
  save: (options?: SaveOptions) => Promise<SaveResult>;
  hasChanges: (options?: SaveOptions) => boolean;
}

/**
 * 저장한 뒤 상세를 다시 읽지 않음. 작성 중 원본은 store이고, 상세 캐시로 그리는 화면(작성 화면·등록 내역)은 들어올 때마다
 * loader가 새로 읽으므로 작성 화면의 상세 캐시는 저장 전 값일 수 있음(초안 값은 store에서 읽음).
 */
export function createDraftSaver(store: RegisterWizardStoreApi): DraftSaver {
  let queue: Promise<SaveResult> = Promise.resolve({ ok: true });

  async function saveChangedSteps(options: SaveOptions): Promise<SaveResult> {
    for (;;) {
      let state = store.getState();
      const [step] = getChangedSteps(state, options);
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
      store.getState().markSaved(step, snapshot[step]);
      if (isTypeChanged) {
        store.getState().markServerCleared(STEPS_CLEARED_BY_TYPE_CHANGE);
      }
    }
    return { ok: true };
  }

  return {
    save: (options = {}) => {
      const run = () => saveChangedSteps(options);
      queue = queue.then(run, run);
      return queue;
    },
    hasChanges: (options) =>
      getChangedSteps(store.getState(), options).length > 0,
  };
}
