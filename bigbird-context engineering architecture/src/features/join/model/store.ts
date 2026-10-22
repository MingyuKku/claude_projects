import { devtools } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import type {
  AccountFields,
  CompanyFields,
  JoinStage,
  SnsTokenData,
  TermsFields,
} from "./types";

export interface CertSuccess {
  certIdx: number | null;
  name: string;
  phoneNumber: string;
}

export interface JoinState {
  account: AccountFields;
  company: CompanyFields;
  terms: TermsFields;
  stage: JoinStage;
  tokenData: SnsTokenData | null;
}

export interface JoinActions {
  patchAccount: (patch: Partial<AccountFields>) => void;
  patchCompany: (patch: Partial<CompanyFields>) => void;
  patchTerms: (patch: Partial<TermsFields>) => void;
  setStage: (stage: JoinStage) => void;
  /** The contact number defaults to the verified phone; the company step lets the user change it. */
  applyCertSuccess: (success: CertSuccess) => void;
  reset: () => void;
}

export type JoinStore = JoinState & JoinActions;

function createInitialState(tokenData: SnsTokenData | null): JoinState {
  return {
    account: {
      id: "",
      password: "",
      passwordAgain: "",
      name: "",
      phoneNumber: "",
      certIdx: null,
      email: "",
      idStatus: "idle",
      emailStatus: "idle",
    },
    company: {
      companyName: "",
      companyContact: "",
      companyRegistrationNumber: "",
      mailorderParts: ["", "", ""],
      classification: null,
      companyUrl: "",
      companyRegistrationUploaded: false,
      mailorderUploaded: false,
      companyRegistrationFileName: "",
      companyRegistrationFileSize: "",
      mailorderFileName: "",
      mailorderFileSize: "",
    },
    terms: { service: false, privacy: false },
    stage: "info",
    tokenData,
  };
}

/** One store per wizard mount, so every visit starts clean and the SNS identity seeds it. */
export function createJoinStore(tokenData: SnsTokenData | null = null) {
  return createStore<JoinStore>()(
    devtools(
      (set) => ({
        ...createInitialState(tokenData),
        patchAccount: (patch) =>
          set(
            (state) => ({ account: { ...state.account, ...patch } }),
            false,
            "patchAccount",
          ),
        patchCompany: (patch) =>
          set(
            (state) => ({ company: { ...state.company, ...patch } }),
            false,
            "patchCompany",
          ),
        patchTerms: (patch) =>
          set(
            (state) => ({ terms: { ...state.terms, ...patch } }),
            false,
            "patchTerms",
          ),
        setStage: (stage) => set({ stage }, false, "setStage"),
        applyCertSuccess: (success) =>
          set(
            (state) => ({
              account: {
                ...state.account,
                certIdx: success.certIdx,
                name: success.name,
                phoneNumber: success.phoneNumber,
              },
              company: {
                ...state.company,
                companyContact: success.phoneNumber,
              },
            }),
            false,
            "applyCertSuccess",
          ),
        reset: () => set(createInitialState(tokenData), false, "reset"),
      }),
      { name: "join" },
    ),
  );
}

export type JoinStoreApi = ReturnType<typeof createJoinStore>;
