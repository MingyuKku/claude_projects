import { devtools } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { applyProductPatch } from "../lib/apply-product-patch";
import { changeCampaignType } from "../lib/change-campaign-type";

import type {
  CampaignDraft,
  CampaignDraftSaveResult,
  CampaignSection,
  CampaignType,
} from "@/entities/campaign";

// 마법사가 작성 중인 초안을 소유하는 store. 서버 데이터를 Zustand에 복사하지 않는다는 원칙의 예외임.
// 진입할 때 서버 초안으로 한 번만 채우고 그 뒤 원본은 이 store임. 저장 응답은 버전·저장 시각·종료일만 반영하고 입력값은 건드리지 않아서,
// 입력 중인 값이 저장 응답으로 되돌아가지 않음.

type Sections = Pick<
  CampaignDraft,
  "campaignInfo" | "product" | "influencer" | "intro" | "conditions"
>;

/** 다시 시도해도 저장되지 않는 이유: 다른 화면에서 먼저 저장했거나(버전 충돌), 저장할 수 없는 상태가 됐음. 자동 저장을 멈추고 안내해야 함. */
export type SaveBlockedReason = "VERSION_CONFLICT" | "NOT_EDITABLE";

export interface CampaignRegisterState {
  draft: CampaignDraft;
  saveBlockedReason: SaveBlockedReason | null;
  /** 사용자가 바꿀 때마다 오르는 값. 저장해야 할 변경이 있는지 `savedRevision`과 비교해 정함. */
  revision: number;
  /** 서버에 저장한 마지막 `revision`. */
  savedRevision: number;
}

export interface CampaignRegisterActions {
  patchCampaignInfo: (
    patch: Partial<Omit<Sections["campaignInfo"], "campaignType" | "endDate">>,
  ) => void;
  /** 유형을 바꾸면 2단계 입력과 6단계의 유형 전용 값이 비워짐(확인 알럿은 부르는 쪽이 먼저 띄움). */
  changeCampaignType: (campaignType: CampaignType) => void;
  patchProduct: (patch: Partial<Sections["product"]>) => void;
  patchInfluencer: (patch: Partial<Sections["influencer"]>) => void;
  setAddOns: (addOns: CampaignDraft["addOns"]) => void;
  patchIntro: (patch: Partial<Sections["intro"]>) => void;
  patchConditions: (patch: Partial<Sections["conditions"]>) => void;
  patchAgreements: (
    patch: Partial<CampaignDraft["policy"]["agreements"]>,
  ) => void;
  /** 사용자가 이 단계에 가 봤음을 남김. 이미 가 본 단계면 아무것도 하지 않음. */
  markVisited: (section: CampaignSection) => void;
  /** 이전 캠페인 불러오기처럼 서버가 이미 저장한 초안으로 통째로 바꿈. 저장할 변경은 남지 않음. */
  replaceWithSavedDraft: (draft: CampaignDraft) => void;
  setSaveBlockedReason: (reason: SaveBlockedReason | null) => void;
  /** 저장을 마친 `revision`까지 저장된 것으로 보고, 서버가 정한 값(버전·저장 시각·종료일)만 반영함. */
  applySaveResult: (
    result: CampaignDraftSaveResult,
    savedRevision: number,
  ) => void;
}

export type CampaignRegisterStore = CampaignRegisterState &
  CampaignRegisterActions;

/** 캠페인마다 새로 만들고 화면을 떠나면 버림. */
export function createCampaignRegisterStore(initialDraft: CampaignDraft) {
  return createStore<CampaignRegisterStore>()(
    devtools(
      (set) => {
        // 사용자 변경: 초안을 바꾸고 저장할 변경이 생겼음을 남김.
        const edit = (
          action: string,
          recipe: (draft: CampaignDraft) => CampaignDraft,
        ) =>
          set(
            (state) => ({
              draft: recipe(state.draft),
              revision: state.revision + 1,
            }),
            false,
            action,
          );

        return {
          draft: initialDraft,
          saveBlockedReason: null,
          revision: 0,
          savedRevision: 0,
          patchCampaignInfo: (patch) =>
            edit("patchCampaignInfo", (draft) => ({
              ...draft,
              campaignInfo: { ...draft.campaignInfo, ...patch },
            })),
          changeCampaignType: (campaignType) =>
            edit("changeCampaignType", (draft) =>
              changeCampaignType(draft, campaignType),
            ),
          patchProduct: (patch) =>
            edit("patchProduct", (draft) => ({
              ...draft,
              product: applyProductPatch(draft.product, patch),
            })),
          patchInfluencer: (patch) =>
            edit("patchInfluencer", (draft) => ({
              ...draft,
              influencer: { ...draft.influencer, ...patch },
            })),
          setAddOns: (addOns) =>
            edit("setAddOns", (draft) => ({ ...draft, addOns })),
          patchIntro: (patch) =>
            edit("patchIntro", (draft) => ({
              ...draft,
              intro: { ...draft.intro, ...patch },
            })),
          patchConditions: (patch) =>
            edit("patchConditions", (draft) => ({
              ...draft,
              conditions: { ...draft.conditions, ...patch },
            })),
          patchAgreements: (patch) =>
            edit("patchAgreements", (draft) => ({
              ...draft,
              policy: {
                agreements: { ...draft.policy.agreements, ...patch },
              },
            })),
          markVisited: (section) =>
            set(
              (state) =>
                state.draft.visitedSteps.includes(section)
                  ? state
                  : {
                      draft: {
                        ...state.draft,
                        visitedSteps: [...state.draft.visitedSteps, section],
                      },
                      revision: state.revision + 1,
                    },
              false,
              "markVisited",
            ),
          replaceWithSavedDraft: (draft) =>
            set(
              (state) => ({
                draft,
                revision: state.revision + 1,
                savedRevision: state.revision + 1,
              }),
              false,
              "replaceWithSavedDraft",
            ),
          setSaveBlockedReason: (saveBlockedReason) =>
            set({ saveBlockedReason }, false, "setSaveBlockedReason"),
          applySaveResult: (result, savedRevision) =>
            set(
              (state) => ({
                draft: {
                  ...state.draft,
                  version: result.version,
                  updatedAt: result.updatedAt,
                  campaignInfo: {
                    ...state.draft.campaignInfo,
                    endDate: result.endDate,
                  },
                },
                savedRevision: Math.max(state.savedRevision, savedRevision),
              }),
              false,
              "applySaveResult",
            ),
        };
      },
      { name: "campaign-register" },
    ),
  );
}

export type CampaignRegisterStoreApi = ReturnType<
  typeof createCampaignRegisterStore
>;

/** 저장해야 할 변경이 남아 있는가. */
export function hasUnsavedChanges(state: CampaignRegisterState) {
  return state.revision > state.savedRevision;
}
