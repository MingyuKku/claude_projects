import { isApiError } from "@/shared/api";

import {
  AUTOSAVE_DEBOUNCE_MS,
  AUTOSAVE_MAX_WAIT_MS,
  AUTOSAVE_RETRY_MS,
} from "./constants";
import { hasUnsavedChanges } from "./store";

import type { CampaignRegisterStoreApi, SaveBlockedReason } from "./store";
import type {
  CampaignDraft,
  CampaignDraftSaveResult,
} from "@/entities/campaign";

interface AutosaveOptions {
  store: CampaignRegisterStoreApi;
  /** 초안 전체를 서버에 덮어씀(A-3). */
  save: (draft: CampaignDraft) => Promise<CampaignDraftSaveResult>;
  /**
   * 저장이 끝난 뒤 보낸 초안과 응답으로 캐시를 맞추는 등 밖의 일을 함. Promise를 돌려주면 그것이 끝난 뒤에 저장 완료로 알림:
   * 저장 직후 화면을 옮기는 쪽(수정 모드 복귀)이 캐시를 맞추는 중에 새 화면의 첫 조회가 시작되면 SWR이 그 조회 결과를 버려서
   * 로딩에 멈추기 때문임.
   */
  onSaved?: (
    sent: CampaignDraft,
    result: CampaignDraftSaveResult,
  ) => void | Promise<unknown>;
}

export interface AutosaveController {
  /** 저장할 변경을 기다리지 않고 지금 저장함. 모두 저장됐으면 true, 실패하거나 저장이 막혀 있으면 false. */
  flush: () => Promise<boolean>;
  /** store의 변경을 지켜보기 시작함. 돌려주는 함수가 멈추고, 저장하지 못한 변경이 남았으면 마지막으로 한 번 보냄. */
  start: () => () => void;
}

function toBlockedReason(error: unknown): SaveBlockedReason | null {
  if (!isApiError(error) || error.status !== 409) return null;
  const reason =
    typeof error.data === "object" && error.data !== null
      ? (error.data as { reason?: unknown }).reason
      : undefined;
  return reason === "VERSION_CONFLICT" || reason === "NOT_EDITABLE"
    ? reason
    : null;
}

/**
 * 마법사 초안의 자동 저장.
 * - 바뀐 내용이 있으면 마지막 입력 3초 뒤에 저장하고, 입력이 계속돼도 바뀐 내용이 남아 있는 동안 최대 30초마다 저장함.
 * - 저장은 한 번에 하나만 보내고, 보내는 동안 생긴 변경은 끝난 뒤 이어서 보냄(그 변경이 만든 타이머가 이어 받음).
 * - 자동 저장이 실패하면 조용히 다음 주기에 다시 보냄. 버전 충돌·저장 불가는 다시 보내도 같으므로 멈추고 `saveBlockedReason`으로 알림.
 * - 단계 이동·"임시저장"은 `flush`로 기다리지 않고 바로 저장함.
 */
export function createAutosaveController({
  store,
  save,
  onSaved,
}: AutosaveOptions): AutosaveController {
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let maxWaitTimer: ReturnType<typeof setTimeout> | undefined;
  let running: Promise<boolean> | null = null;
  // 멈춘 뒤 마지막 저장이 실패해도 재시도 타이머를 되살리지 않기 위함.
  let isStopped = false;

  function clearTimers() {
    clearTimeout(debounceTimer);
    clearTimeout(maxWaitTimer);
    debounceTimer = undefined;
    maxWaitTimer = undefined;
  }

  function isBlocked() {
    return store.getState().saveBlockedReason !== null;
  }

  function schedule(debounceMs: number) {
    if (isStopped || isBlocked()) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void flush(), debounceMs);
    // 최대 간격은 바뀐 내용이 처음 생긴 때부터 셈. 이미 돌고 있으면 건드리지 않음.
    maxWaitTimer ??= setTimeout(() => void flush(), AUTOSAVE_MAX_WAIT_MS);
  }

  async function saveOnce() {
    const { draft, revision } = store.getState();
    let result: CampaignDraftSaveResult;
    try {
      result = await save(draft);
    } catch (error) {
      const blockedReason = toBlockedReason(error);
      if (blockedReason) {
        store.getState().setSaveBlockedReason(blockedReason);
      } else {
        console.error(error);
        schedule(AUTOSAVE_RETRY_MS);
      }
      return false;
    }
    store.getState().applySaveResult(result, revision);
    // 저장은 이미 끝났으므로 캐시를 맞추다 실패해도 저장 실패로 보지 않음(다시 보내지 않음).
    try {
      await onSaved?.(draft, result);
    } catch (error) {
      console.error(error);
    }
    return true;
  }

  function flush(): Promise<boolean> {
    clearTimers();
    // 보내는 중이면 끝나기를 기다렸다가 그사이 생긴 변경까지 이어서 보냄.
    if (running) return running.then(() => flush());
    if (!hasUnsavedChanges(store.getState())) return Promise.resolve(true);
    if (isBlocked()) return Promise.resolve(false);

    running = saveOnce().finally(() => {
      running = null;
    });
    return running;
  }

  function start() {
    isStopped = false;
    const unsubscribe = store.subscribe((state, previous) => {
      if (state.revision === previous.revision) return;
      if (hasUnsavedChanges(state)) schedule(AUTOSAVE_DEBOUNCE_MS);
    });
    return () => {
      isStopped = true;
      unsubscribe();
      clearTimers();
      // 화면을 떠나는 순간 아직 못 보낸 마지막 입력을 잃지 않게 함.
      if (hasUnsavedChanges(store.getState()) && !isBlocked()) void flush();
    };
  }

  return { flush, start };
}
