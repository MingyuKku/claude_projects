import { useState } from "react";

import {
  confirmPostingGuide,
  createEmptyBasicCondition,
  isBasicConditionComplete,
  savePostingGuideBasicCondition,
  savePostingGuideContent,
  skipPostingGuide,
  startPostingGuide,
} from "@/entities/campaign-progress";
import { isApiError } from "@/shared/api";

import type {
  PostingGuide,
  PostingGuideBasicCondition,
  PostingGuideMethod,
} from "@/entities/campaign-progress";

export type PendingGuideAction = "saveDraft" | "confirm" | "skip";

interface UsePostingGuideFormInput {
  campaignIdx: number;
  /** 서버 가이드. null이면 아직 만든 적 없음. */
  guide: PostingGuide | null;
  /** AI 가이드를 쓸 수 있는지(결제·등록 때 구독). 처음 고를 방식에 씀. */
  isAiPaid: boolean;
  /** 저장·건너뛰기·확정 뒤 받은 가이드로 캐시를 바꿈. */
  onSaved: (guide: PostingGuide) => void;
  /** 여러 요청 중 일부만 성공했을 수 있어 실패하면 서버 값을 다시 읽음. */
  onFailed: () => void;
}

/**
 * 가이드 작성 상태. 서버에 방식이 있으면 그 방식, 없으면 AI를 쓸 수 있을 때 AI, 아니면 직접 작성으로 시작함
 * (시안 캡션 14165:273309 "미구독이면 직접 작성하기가 Default").
 */
export function usePostingGuideForm({
  campaignIdx,
  guide,
  isAiPaid,
  onSaved,
  onFailed,
}: UsePostingGuideFormInput) {
  const [method, setMethod] = useState<PostingGuideMethod>(
    guide?.method ?? (isAiPaid ? "AI" : "MANUAL"),
  );
  const [condition, setCondition] = useState<PostingGuideBasicCondition>(
    guide?.basicCondition ?? createEmptyBasicCondition(),
  );
  const [contentGuide, setContentGuide] = useState(guide?.contentGuide ?? "");
  const [pending, setPending] = useState<PendingGuideAction | null>(null);

  function patch(value: Partial<PostingGuideBasicCondition>) {
    setCondition((current) => ({ ...current, ...value }));
  }

  /**
   * 가이드가 없거나 서버 방식과 고른 방식이 다르면 `POST`로 만들거나 방식을 바꾼 뒤 기본 조건을 저장함
   * (다시 부르면 방식만 바뀌고 쓴 내용은 남음, 백엔드 답 B-12). 예전 서버의 409는 그대로 저장으로 넘어감.
   */
  async function saveCondition() {
    if (guide === null || guide.method !== method) {
      try {
        await startPostingGuide(campaignIdx, method);
      } catch (error) {
        if (!isApiError(error) || error.status !== 409) throw error;
      }
    }
    await savePostingGuideBasicCondition(campaignIdx, condition);
    // 직접 작성의 예시 탭 값. 한 번에 저장하는 API가 없어 차례로 보냄.
    return savePostingGuideContent(campaignIdx, contentGuide);
  }

  async function run(
    action: PendingGuideAction,
    task: () => Promise<PostingGuide>,
  ) {
    setPending(action);
    try {
      const saved = await task();
      onSaved(saved);
      return true;
    } catch {
      onFailed();
      return false;
    } finally {
      setPending(null);
    }
  }

  return {
    method,
    setMethod,
    condition,
    patch,
    contentGuide,
    setContentGuide,
    pending,
    // 콘텐츠 개요도 시안의 필수(*) 항목.
    isComplete:
      isBasicConditionComplete(condition) && contentGuide.trim() !== "",
    saveDraft: () => run("saveDraft", saveCondition),
    confirm: () =>
      run("confirm", async () => {
        await saveCondition();
        return confirmPostingGuide(campaignIdx);
      }),
    skip: () => run("skip", () => skipPostingGuide(campaignIdx)),
  };
}
