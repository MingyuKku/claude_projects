import { tryit } from "radash";

import {
  isSimpleSuccess,
  isTooManyRequests,
  readFailureReason,
} from "@/entities/account";

import {
  changeMasterEmail,
  changeMasterPassword,
  changeSubEmail,
  changeSubPassword,
  uploadProfileImage,
  uploadSubProfileImage,
} from "../api/profile-api";

import type { ProfileSavePlan } from "./profile-form";

export type SaveStep = "image" | "email" | "password";
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
  /** 현재 연결된 본인인증 인덱스. 이메일을 바꿀 때 함께 보냄. */
  certIdx: number | null;
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
 * 이미지 → 이메일 → 비밀번호 순으로 저장하고 첫 실패에서 멈춤. 비밀번호를 마지막에 두는 이유는
 * 서버가 비밀번호를 바꾸면 세션을 무효화할 수 있어서(확인 전), 앞 단계가 먼저 끝나야 하기 때문.
 */
export async function saveAccountProfile(params: SaveParams) {
  const {
    role = "master",
    plan,
    password,
    email,
    certIdx,
    imageFile,
    hasExistingImage,
  } = params;
  const isSub = role === "sub";
  const completed: SaveStep[] = [];

  async function run(step: SaveStep, request: () => Promise<unknown>) {
    const [error, response] = await tryit(request)();
    if (error) return toFailureCode(error);
    if (!isSimpleSuccess(response)) return "generic" as const;
    completed.push(step);
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

  if (plan.hasEmailChange) {
    // Master는 본인인증이 없으면 서버가 이메일 변경을 받지 않음. Sub ID는 인증 없이 값만 보냄.
    let request: (() => Promise<unknown>) | null = null;
    if (isSub) request = () => changeSubEmail(email);
    else if (certIdx !== null)
      request = () => changeMasterEmail({ certIdx, email });
    if (!request) return { completed, failure: "generic" } satisfies SaveResult;
    const failure = await run("email", request);
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
