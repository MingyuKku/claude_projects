import { isEqual } from "radash";
import { devtools } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { createEmptyDraft } from "@/entities/campaign";

import type {
  CampaignDetail,
  CampaignDraft,
  CampaignDraftStep,
  CampaignProductType,
  CampaignServiceType,
  CampaignType,
} from "@/entities/campaign";

// 마법사가 작성 중 초안을 소유함(스펙 §5, "서버 데이터를 Zustand에 복사하지 않음"의 예외). 진입할 때 상세 조회로 한 번만
// 채우고, 저장 응답으로 다시 채우지 않음(입력 중인 값이 되돌아가지 않게). 캠페인마다 Provider가 새로 만들고 떠나면 버림.

export type WizardDialog = "requiredInfo" | "notEditable";

type ObjectDraftStep = Exclude<CampaignDraftStep, "addOns">;

export interface RegisterWizardState {
  campaignIdx: number;
  /** 서버가 정한 읽기 전용 코드(1단계 첫 줄). */
  campaignCode: string;
  serviceType: CampaignServiceType;
  productType: CampaignProductType;
  isDemo: boolean;
  draft: CampaignDraft;
  /** 단계별 마지막으로 저장한 값. 바뀐 단계만 보내려고 둠. */
  savedDraft: CampaignDraft;
  /** 결제 단계에 들어온 뒤로는 필수값이 빠진 단계에 경고를 보임. 저장하지 않음. */
  hasVisitedPayment: boolean;
  /** 저장 없이 나가도 되는 상태(수정 불가 안내 뒤 등록 내역으로 갈 때). */
  isLeaveAllowed: boolean;
  dialog: WizardDialog | null;
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
  markSaved: <S extends CampaignDraftStep>(
    step: S,
    value: CampaignDraft[S],
  ) => void;
  /** 이전 캠페인 불러오기(서버 복사) 뒤 다시 읽은 값으로 초안을 한 번 다시 채움(스펙 §5 "한 번만 채움"의 예외). */
  replaceDraft: (draft: CampaignDraft) => void;
  /** 캠페인 유형을 바꾸고 2~7단계 입력값을 모두 비움(REQ-10-0022·0023). 1단계의 다른 값은 그대로. */
  changeCampaignType: (campaignType: CampaignType) => void;
  /** 서버가 비운 단계(유형 변경, A-5.1)를 저장된 값에서도 비움. */
  markServerCleared: (steps: readonly CampaignDraftStep[]) => void;
  markPaymentVisited: () => void;
  allowLeave: () => void;
  openDialog: (dialog: WizardDialog) => void;
  closeDialog: () => void;
}

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
        draft: detail.draft,
        savedDraft: detail.draft,
        hasVisitedPayment: false,
        isLeaveAllowed: false,
        dialog: null,
        setStepDraft: (step, value) =>
          set((state) => ({ draft: { ...state.draft, [step]: value } })),
        patchStepDraft: (step, patch) =>
          set((state) => ({
            draft: {
              ...state.draft,
              [step]: { ...state.draft[step], ...patch },
            },
          })),
        markSaved: (step, value) =>
          set((state) => ({
            savedDraft: { ...state.savedDraft, [step]: value },
          })),
        replaceDraft: (draft) => set({ draft, savedDraft: draft }),
        changeCampaignType: (campaignType) =>
          set((state) => {
            const empty = createEmptyDraft();
            return {
              draft: {
                ...empty,
                info: { ...state.draft.info, campaignType },
              },
            };
          }),
        markServerCleared: (steps) =>
          set((state) => {
            const empty = createEmptyDraft();
            const savedDraft = { ...state.savedDraft };
            for (const step of steps)
              Object.assign(savedDraft, { [step]: empty[step] });
            return { savedDraft };
          }),
        markPaymentVisited: () => set({ hasVisitedPayment: true }),
        allowLeave: () => set({ isLeaveAllowed: true }),
        openDialog: (dialog) => set({ dialog }),
        closeDialog: () => set({ dialog: null }),
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
