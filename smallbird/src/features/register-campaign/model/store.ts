import { isEqual } from "radash";
import { devtools } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { createEmptyDraft } from "@/entities/campaign";

import { applyDraftDefaults } from "./draft-defaults";
import { revokePendingIntroMedia } from "./pending-media";

import type { UploadedCampaignFile } from "../api/upload-campaign-file";
import type {
  CampaignDetail,
  CampaignDraft,
  CampaignDraftStep,
  CampaignMedia,
  CampaignProductType,
  CampaignServiceType,
  CampaignType,
} from "@/entities/campaign";

// 마법사가 작성 중 초안을 소유함(스펙 §5, "서버 데이터를 Zustand에 복사하지 않음"의 예외). 진입할 때 상세 조회로 한 번만
// 채우고, 저장 응답으로 다시 채우지 않음(입력 중인 값이 되돌아가지 않게). 캠페인마다 Provider가 새로 만들고 떠나면 버림.

export type WizardDialog = "requiredInfo" | "notEditable";

/** 5단계 작성 방식. 서버에 저장되지 않음. */
export type IntroMode = "AI" | "MANUAL";

/**
 * 사용자가 눌러 저장을 기다리는 동작. 하단 버튼의 Loading 표시와 중복 클릭 막기에 씀. "이전"·"임시저장"은 그 버튼에,
 * 그 밖의 이동(다음·사이드바)과 떠나기(`leave`, 헤더 "<"·브라우저 뒤로가기)는 "다음"에 표시함.
 */
export type PendingSaveAction = "previous" | "next" | "saveDraft" | "leave";

export interface IntroAiState {
  url: string;
  /** 생성 중인 작업 번호. 유형 변경·불러오기로 버린 작업의 결과를 무시하려고 둠. null이면 생성 중 아님. */
  jobId: number | null;
  /** 이번 방문에서 AI 결과를 받았는지. 받으면 "AI 생성" 카드를 보임. */
  hasResult: boolean;
  /** 마지막으로 끝난 작업의 결과. 다른 단계에 있어도 완료·실패를 알리려고 둠. */
  lastOutcome: "SUCCEEDED" | "FAILED" | null;
}

const IDLE_INTRO_AI: IntroAiState = {
  url: "",
  jobId: null,
  hasResult: false,
  lastOutcome: null,
};

/** 5단계 파일을 올리는 진행. null이면 올리는 중 아님. */
export interface UploadProgress {
  done: number;
  total: number;
}

type ObjectDraftStep = Exclude<CampaignDraftStep, "addOns">;

export interface RegisterWizardState {
  campaignIdx: number;
  /** 서버가 정한 읽기 전용 코드(1단계 첫 줄). */
  campaignCode: string;
  serviceType: CampaignServiceType;
  productType: CampaignProductType;
  isDemo: boolean;
  /** 반려 뒤 수정 모드. 결제 금액·동의·결제 단계는 읽기 전용. */
  isRevisionMode: boolean;
  draft: CampaignDraft;
  /** 단계별 마지막으로 저장한 값. 바뀐 단계만 보내려고 둠. */
  savedDraft: CampaignDraft;
  /** 화면에 연 단계. 연 단계는 기본 선택만 있어도 사용자가 본 값이라 이동할 때 저장함(`getChangedSteps`). */
  shownSteps: CampaignDraftStep[];
  /** 저장 없이 나가도 되는 상태(수정 불가 안내 뒤 등록 내역으로 갈 때). */
  isLeaveAllowed: boolean;
  dialog: WizardDialog | null;
  introMode: IntroMode;
  introAi: IntroAiState;
  uploadProgress: UploadProgress | null;
  /** 저장을 기다리는 동작들. 이동 저장 중에 떠나기 저장이 겹치면 각자 끝날 때 자기 것만 빼서 표시가 먼저 꺼지지 않게 함. */
  pendingSaves: PendingSaveAction[];
  /** 화면에 표시할 동작(`pendingSaves`의 첫 항목). */
  pendingSave: PendingSaveAction | null;
}

export interface RegisterWizardActions {
  setStepDraft: <S extends CampaignDraftStep>(
    step: S,
    value: CampaignDraft[S],
  ) => void;
  patchStepDraft: <S extends ObjectDraftStep>(
    step: S,
    patch: Partial<CampaignDraft[S]>,
  ) => void;
  markStepShown: (step: CampaignDraftStep) => void;
  markSaved: <S extends CampaignDraftStep>(
    step: S,
    value: CampaignDraft[S],
  ) => void;
  /** 이전 캠페인 불러오기(서버 복사) 뒤 다시 읽은 값으로 초안을 한 번 다시 채움(스펙 §5 "한 번만 채움"의 예외). */
  replaceDraft: (draft: CampaignDraft) => void;
  /** 캠페인 유형을 바꾸고 2~7단계 입력값을 모두 비움(REQ-10-0022·0023). 1단계의 다른 값은 그대로. */
  changeCampaignType: (campaignType: CampaignType) => void;
  /** 올리기 전 파일(`file`)을 올려서 받은 번호·주소로 바꿈. 그사이 지운 파일이면 아무것도 안 함. */
  resolvePendingMedia: (file: File, uploaded: UploadedCampaignFile) => void;
  setUploadProgress: (progress: UploadProgress | null) => void;
  startPendingSave: (action: PendingSaveAction) => void;
  /** `startPendingSave`로 넣은 동작 하나를 뺌. */
  endPendingSave: (action: PendingSaveAction) => void;
  /** 서버가 비운 단계(유형 변경, A-5.1)를 저장된 값에서도 비움. */
  markServerCleared: (steps: readonly CampaignDraftStep[]) => void;
  allowLeave: () => void;
  openDialog: (dialog: WizardDialog) => void;
  closeDialog: () => void;
  setIntroMode: (mode: IntroMode) => void;
  setIntroAiUrl: (url: string) => void;
  /** 생성을 시작하고 작업 번호를 돌려줌. */
  startIntroGeneration: () => number;
  /** 결과가 오면 소개서 전체를 덮어씀. 실패(null)면 기존 입력을 그대로 둠. 버린 작업이면 아무것도 안 함. */
  finishIntroGeneration: (
    jobId: number,
    intro: CampaignDraft["intro"] | null,
  ) => void;
}

/** 작성 방식이 서버에 남지 않아, 소개서에 입력값이 있으면 직접 작성으로 엶. */
function getInitialIntroMode(draft: CampaignDraft): IntroMode {
  return isEqual(draft.intro, createEmptyDraft().intro) ? "AI" : "MANUAL";
}

let introJobSequence = 0;

export type RegisterWizardStore = RegisterWizardState & RegisterWizardActions;
export type RegisterWizardStoreApi = ReturnType<
  typeof createRegisterWizardStore
>;

export function createRegisterWizardStore(detail: CampaignDetail) {
  return createStore<RegisterWizardStore>()(
    devtools(
      (set) => ({
        campaignIdx: detail.campaignIdx,
        campaignCode: detail.campaignCode,
        // 작성 화면에는 PICK형만 옴(모집형·모르는 유형은 페이지가 준비 중으로 막음).
        serviceType: detail.serviceType ?? "PICK",
        productType: detail.productType ?? "BRAND",
        isDemo: detail.isDemo,
        isRevisionMode: detail.stage === "REJECTED",
        draft: applyDraftDefaults(detail.draft, {
          hasServerCampaignType: detail.rawCampaignType !== null,
        }),
        savedDraft: detail.draft,
        shownSteps: [],
        isLeaveAllowed: false,
        dialog: null,
        introMode: getInitialIntroMode(detail.draft),
        introAi: IDLE_INTRO_AI,
        uploadProgress: null,
        pendingSaves: [],
        pendingSave: null,
        setStepDraft: (step, value) =>
          set((state) => ({ draft: { ...state.draft, [step]: value } })),
        patchStepDraft: (step, patch) =>
          set((state) => ({
            draft: {
              ...state.draft,
              [step]: { ...state.draft[step], ...patch },
            },
          })),
        markStepShown: (step) =>
          set((state) =>
            state.shownSteps.includes(step)
              ? {}
              : { shownSteps: [...state.shownSteps, step] },
          ),
        markSaved: (step, value) =>
          set((state) => ({
            savedDraft: { ...state.savedDraft, [step]: value },
          })),
        replaceDraft: (draft) =>
          set((state) => {
            revokePendingIntroMedia(state.draft.intro);
            return {
              draft: applyDraftDefaults(draft),
              savedDraft: draft,
              introMode: getInitialIntroMode(draft),
              introAi: IDLE_INTRO_AI,
            };
          }),
        changeCampaignType: (campaignType) =>
          set((state) => {
            revokePendingIntroMedia(state.draft.intro);
            const empty = createEmptyDraft();
            return {
              draft: applyDraftDefaults({
                ...empty,
                info: { ...state.draft.info, campaignType },
              }),
              introMode: "AI",
              // 진행 중인 AI 생성 작업도 버림.
              introAi: IDLE_INTRO_AI,
            };
          }),
        resolvePendingMedia: (file, uploaded) =>
          set((state) => {
            const { mainImage, detailMedia } = state.draft.intro;
            const resolve = (media: CampaignMedia) => {
              if (media.file !== file) return media;
              URL.revokeObjectURL(media.url);
              return uploaded;
            };
            return {
              draft: {
                ...state.draft,
                intro: {
                  ...state.draft.intro,
                  mainImage: mainImage ? resolve(mainImage) : null,
                  detailMedia: detailMedia.map(resolve),
                },
              },
            };
          }),
        setUploadProgress: (uploadProgress) => set({ uploadProgress }),
        startPendingSave: (action) =>
          set((state) => {
            const pendingSaves = [...state.pendingSaves, action];
            return { pendingSaves, pendingSave: pendingSaves[0] ?? null };
          }),
        endPendingSave: (action) =>
          set((state) => {
            const index = state.pendingSaves.indexOf(action);
            if (index === -1) return {};
            const pendingSaves = state.pendingSaves.filter(
              (_, i) => i !== index,
            );
            return { pendingSaves, pendingSave: pendingSaves[0] ?? null };
          }),
        markServerCleared: (steps) =>
          set((state) => {
            const empty = createEmptyDraft();
            const savedDraft = { ...state.savedDraft };
            for (const step of steps)
              Object.assign(savedDraft, { [step]: empty[step] });
            return { savedDraft };
          }),
        allowLeave: () => set({ isLeaveAllowed: true }),
        openDialog: (dialog) => set({ dialog }),
        closeDialog: () => set({ dialog: null }),
        setIntroMode: (introMode) => set({ introMode }),
        setIntroAiUrl: (url) =>
          set((state) => ({ introAi: { ...state.introAi, url } })),
        startIntroGeneration: () => {
          introJobSequence += 1;
          const jobId = introJobSequence;
          set((state) => ({ introAi: { ...state.introAi, jobId } }));
          return jobId;
        },
        finishIntroGeneration: (jobId, intro) =>
          set((state) => {
            if (state.introAi.jobId !== jobId) return {};
            if (!intro) {
              return {
                introAi: {
                  ...state.introAi,
                  jobId: null,
                  lastOutcome: "FAILED",
                },
              };
            }
            revokePendingIntroMedia(state.draft.intro);
            return {
              draft: { ...state.draft, intro },
              introAi: {
                ...state.introAi,
                jobId: null,
                hasResult: true,
                lastOutcome: "SUCCEEDED",
              },
            };
          }),
      }),
      { name: "register-campaign-wizard" },
    ),
  );
}

export function isStepChanged(
  state: Pick<RegisterWizardState, "draft" | "savedDraft">,
  step: CampaignDraftStep,
) {
  return !isEqual(state.draft[step], state.savedDraft[step]);
}
