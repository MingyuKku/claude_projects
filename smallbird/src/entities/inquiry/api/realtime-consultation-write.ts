import { getFirestoreDb } from "@/shared/api";

import { planAcquireLock, planReleaseLock } from "../lib/consultation-write";
import { createInquiryId } from "../lib/create-inquiry-id";

import type { AccountDoc, Fields, Lock, Plan } from "../lib/consultation-write";

// 프론트가 아직 직접 쓰는 Firestore: 계정 문서의 응대 락과 운영 알림 필드뿐. 상담 문서(sequence)는 서버가 씀
// (백엔드 흐름도 프론트팀 가이드 2026-11-03). 락 판단은 lib/consultation-write.ts의 순수 함수가 함.

export interface ConsultationTarget {
  threadUserIdx: number;
  sequence: number;
}

export type WriteResult =
  { ok: true; skipped: boolean } | { ok: false; reason: "lock-lost" };

// 응대 락은 계정 문서만 트랜잭션으로 읽고 고침. 읽은 값이 그 사이 바뀌면 SDK가 최신 값으로 다시 실행함.
async function runAccount(
  { threadUserIdx }: ConsultationTarget,
  decide: (account: AccountDoc | undefined) => Plan,
): Promise<WriteResult> {
  const [db, { doc, runTransaction }] = await Promise.all([
    getFirestoreDb(),
    import("firebase/firestore"),
  ]);
  const account = doc(
    db,
    "helpdesk",
    "0.0.2",
    "threadUserIdx",
    String(threadUserIdx),
  );
  return runTransaction(db, async (tx): Promise<WriteResult> => {
    const accountSnap = await tx.get(account);
    const plan = decide(
      accountSnap.exists() ? (accountSnap.data() as AccountDoc) : undefined,
    );
    if (plan.kind === "reject") return { ok: false, reason: plan.reason };
    if (plan.kind === "skip") return { ok: true, skipped: true };
    tx.update(account, plan.account);
    return { ok: true, skipped: false };
  });
}

const TAB_ID_KEY = "bigbird.tabId";

// 새로고침해도 같은 탭으로 보도록 sessionStorage에 둠(없으면 내 이전 락이 만료될 때까지 스스로 막힘).
function getTabId() {
  try {
    const saved = sessionStorage.getItem(TAB_ID_KEY);
    if (saved) return saved;
    const id = createInquiryId();
    sessionStorage.setItem(TAB_ID_KEY, id);
    return id;
  } catch {
    return createInquiryId();
  }
}

/** 탭마다 하나. 같은 계정의 여러 탭을 구분해 서로의 락을 지우지 않고, 두 번째 탭은 거절함. */
export const TAB_ID = getTabId();

export const acquireConsultationLock = (
  target: ConsultationTarget,
  lock: Lock,
) =>
  runAccount(target, (account) =>
    planAcquireLock(account, lock, target.sequence, Date.now()),
  );

export const releaseConsultationLock = (
  target: ConsultationTarget,
  lock: Lock,
) =>
  runAccount(target, (account) => planReleaseLock(account, lock, Date.now()));

/**
 * 프론트가 써도 되는 계정 문서 필드(백엔드 흐름도 프론트팀 가이드 2026-11-03 "프론트팀 추가"). 백엔드가 쓰는
 * `msgResponseDate`·`updated`·`isConnect` 등은 여기 없음.
 */
export interface HelpdeskAccountFields {
  newSenderUserIdx?: number | null;
  threadBoardType?: number;
  alarmData?: Fields | null;
  currentCampaignIdx?: number | null;
}

/**
 * 계정 문서(`helpdesk/0.0.2/threadUserIdx/{id}`)의 주어진 필드만 부분 갱신함. 문서 전체를 덮어쓰지 않음(`update`).
 * 문서가 아직 없으면 그때만 `senderUserServiceType: "광고주"`를 함께 넣어 만듦(가이드 1번 프론트팀 추가, 운영 화면이 문의
 * 종류를 이 값으로 구분). 만들 때도 병합 쓰기라 다른 필드를 지우지 않음.
 */
export async function updateHelpdeskAccount(
  threadUserIdx: number,
  fields: HelpdeskAccountFields,
) {
  const [db, { doc, FirestoreError, setDoc, updateDoc }] = await Promise.all([
    getFirestoreDb(),
    import("firebase/firestore"),
  ]);
  const ref = doc(
    db,
    "helpdesk",
    "0.0.2",
    "threadUserIdx",
    String(threadUserIdx),
  );
  try {
    await updateDoc(ref, { ...fields });
  } catch (error) {
    if (!(error instanceof FirestoreError) || error.code !== "not-found")
      throw error;
    await setDoc(
      ref,
      { ...fields, senderUserServiceType: "광고주" },
      { merge: true },
    );
  }
}
