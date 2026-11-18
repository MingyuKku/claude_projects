import { tryit } from "radash";

import {
  isSimpleSuccess,
  isTooManyRequests,
  readFailureReason,
} from "@/entities/account";

import {
  changeMasterPassword,
  changeSubEmail,
  changeSubPassword,
  changeSubPhone,
  modifyMasterAccount,
  uploadProfileImage,
  uploadSubProfileImage,
} from "../api/profile-api";

import type { ProfileSavePlan } from "./profile-form";

export type SaveStep = "image" | "phone" | "email" | "password";
/** 번역 키(`toast.save.{code}`). */
export type SaveFailureCode = "tooManyRequests" | "personalInfo" | "generic";

export interface SaveResult {
  /** 서버에 반영된 단계. 일부만 성공했을 때 화면이 그만큼만 되돌림. */
  completed: SaveStep[];
  failure: SaveFailureCode | null;
}

export type AccountRole = "master" | "sub";

interface SaveParams {
  /** Master와 Sub ID는 API 경로가 다름. 기본은 Master. */
  role?: AccountRole;
  plan: ProfileSavePlan;
  password: string;
  email: string;
  /** 현재 연결된 본인인증 인덱스. 휴대폰을 바꾸지 않고 이메일만 바꿀 때 보냄. */
  certIdx: number | null;
  /** 이번에 마친 휴대폰 본인인증. `plan.hasPhoneChange`일 때 씀. */
  verifiedPhone: { certIdx: number; phone: string } | null;
  imageFile: File | null;
  hasExistingImage: boolean;
}

const PERSONAL_INFO_REASON = "contains personal info";

function toFailureCode(error: unknown): SaveFailureCode {
  if (isTooManyRequests(error)) return "tooManyRequests";
  if (readFailureReason(error) === PERSONAL_INFO_REASON) return "personalInfo";
  return "generic";
}

/**
 * 이미지 → 휴대폰·이메일 → 비밀번호 순으로 저장하고 첫 실패에서 멈춤. 비밀번호를 마지막에 두는 이유는
 * 서버가 비밀번호를 바꾸면 세션을 무효화할 수 있어서(확인 전), 앞 단계가 먼저 끝나야 하기 때문.
 */
export async function saveAccountProfile(params: SaveParams) {
  const {
    role = "master",
    plan,
    password,
    email,
    certIdx,
    verifiedPhone,
    imageFile,
    hasExistingImage,
  } = params;
  const isSub = role === "sub";
  const completed: SaveStep[] = [];

  async function run(
    steps: SaveStep | SaveStep[],
    request: () => Promise<unknown>,
  ) {
    const [error, response] = await tryit(request)();
    if (error) return toFailureCode(error);
    if (!isSimpleSuccess(response)) return "generic" as const;
    completed.push(...[steps].flat());
    return null;
  }

  if (plan.hasImageChange && imageFile) {
    const failure = await run("image", () =>
      isSub
        ? uploadSubProfileImage(imageFile, hasExistingImage)
        : uploadProfileImage(imageFile, hasExistingImage),
    );
    if (failure) return { completed, failure } satisfies SaveResult;
  }

  const phoneChange = plan.hasPhoneChange ? verifiedPhone : null;

  if (isSub) {
    // Sub ID는 휴대폰·이메일이 따로 가는 API.
    if (phoneChange) {
      const failure = await run("phone", () =>
        changeSubPhone(phoneChange.phone),
      );
      if (failure) return { completed, failure } satisfies SaveResult;
    }
    if (plan.hasEmailChange) {
      const failure = await run("email", () => changeSubEmail(email));
      if (failure) return { completed, failure } satisfies SaveResult;
    }
  } else if (phoneChange || plan.hasEmailChange) {
    // Master는 휴대폰(새 `certIdx`)과 이메일을 한 요청으로 보냄. 본인인증이 없으면 서버가 받지 않음.
    const nextCertIdx = phoneChange?.certIdx ?? certIdx;
    if (nextCertIdx === null) {
      return { completed, failure: "generic" } satisfies SaveResult;
    }
    const steps: SaveStep[] = [];
    if (phoneChange) steps.push("phone");
    if (plan.hasEmailChange) steps.push("email");
    const failure = await run(steps, () =>
      modifyMasterAccount({ certIdx: nextCertIdx, email }),
    );
    if (failure) return { completed, failure } satisfies SaveResult;
  }

  if (plan.hasPasswordChange) {
    const failure = await run("password", () =>
      isSub ? changeSubPassword(password) : changeMasterPassword(password),
    );
    if (failure) return { completed, failure } satisfies SaveResult;
  }

  return { completed, failure: null } satisfies SaveResult;
}
