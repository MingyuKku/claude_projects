import { z } from "zod";

import type { certDecryptSchema } from "../model/schema";

export type PhoneVerificationState =
  | { status: "idle" }
  | { status: "verifying" }
  | { status: "verified"; certIdx: number; phone: string; name: string }
  /** 다른 계정이 쓰거나 지금과 같은 번호(`same`·`exist`, v2는 둘을 구분하지 않음). */
  | { status: "duplicate" }
  | { status: "failed" }
  | { status: "popupBlocked" };

const DUPLICATE_RESULTS: readonly string[] = ["same", "exist", "exists"];
const FAIL_RESULT = "fail";

/** 복호화 응답 → 화면 상태. 저장에 쓸 `certIdx`나 번호가 없으면 성공으로 보지 않음(v2는 성공으로 봤음). */
export function toPhoneVerificationState(
  response: z.infer<typeof certDecryptSchema>,
): PhoneVerificationState {
  if (DUPLICATE_RESULTS.includes(response.result)) {
    return { status: "duplicate" };
  }
  if (
    response.result === FAIL_RESULT ||
    response.certIdx == null ||
    !response.phoneNumber
  ) {
    return { status: "failed" };
  }
  return {
    status: "verified",
    certIdx: response.certIdx,
    phone: response.phoneNumber,
    name: response.name ?? "",
  };
}

// 모바일은 KMC로 페이지를 옮겼다 돌아와 폼이 새로 그려지므로, 입력 중이던 이메일만 잠깐 보관함.
// 비밀번호는 저장소에 남기지 않음(돌아오면 다시 입력).
const DRAFT_STORAGE_KEY = "account-profile-draft";
const draftSchema = z.object({ email: z.string() });

export type ProfileDraft = z.infer<typeof draftSchema>;

export function saveProfileDraft(draft: ProfileDraft) {
  try {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // 저장이 막혀도 인증은 진행함(돌아오면 이메일만 처음 값).
  }
}

/** 보관한 입력을 꺼내고 지움. 없거나 형식이 다르면 null. */
export function takeProfileDraft(): ProfileDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = draftSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
