import { getFirestoreDb } from "@/shared/api";

import {
  planAbortClose,
  planAcquireLock,
  planAppendMessage,
  planBeginClose,
  planCancelRequest,
  planCreateRequest,
  planFinishClose,
  planMarkExpired,
  planReleaseLock,
  planRetryRequest,
} from "../lib/consultation-write";
import { createInquiryId } from "../lib/create-inquiry-id";

import type {
  AccountDoc,
  AppendInput,
  ConsultationDoc,
  CreateRequestInput,
  Fields,
  Lock,
  Plan,
  RejectReason,
} from "../lib/consultation-write";

// 상담 문서와 계정 문서는 항상 한 트랜잭션에서 읽고 씀. 판단은 lib/consultation-write.ts의
// 순수 함수가 하고, 여기서는 Firestore 읽기·쓰기만 함. 읽은 값이 그 사이 바뀌면 SDK가 트랜잭션을
// 최신 값으로 다시 실행하므로 동시 전송이 서로의 메시지를 덮어쓰지 않음.

export interface ConsultationTarget {
  threadUserIdx: number;
  sequence: number;
}

export type WriteResult =
  { ok: true; skipped: boolean } | { ok: false; reason: RejectReason };

async function refs({ threadUserIdx, sequence }: ConsultationTarget) {
  const [db, firestore] = await Promise.all([
    getFirestoreDb(),
    import("firebase/firestore"),
  ]);
  const account = firestore.doc(
    db,
    "helpdesk",
    "0.0.2",
    "threadUserIdx",
    String(threadUserIdx),
  );
  return {
    db,
    runTransaction: firestore.runTransaction,
    account,
    consultation: firestore.doc(account, "sequence", String(sequence)),
  };
}

async function run(
  target: ConsultationTarget,
  decide: (
    consultation: ConsultationDoc | undefined,
    account: AccountDoc | undefined,
  ) => Plan,
): Promise<WriteResult> {
  const { db, runTransaction, account, consultation } = await refs(target);
  return runTransaction(db, async (tx): Promise<WriteResult> => {
    const [consultationSnap, accountSnap] = await Promise.all([
      tx.get(consultation),
      tx.get(account),
    ]);
    const plan = decide(
      consultationSnap.exists()
        ? (consultationSnap.data() as ConsultationDoc)
        : undefined,
      accountSnap.exists() ? (accountSnap.data() as AccountDoc) : undefined,
    );
    if (plan.kind === "reject") return { ok: false, reason: plan.reason };
    if (plan.kind === "skip") return { ok: true, skipped: true };
    if (plan.consultation) tx.update(consultation, plan.consultation);
    if (plan.account) tx.update(account, plan.account);
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

export const newMessageId = createInquiryId;

/** `target.threadIdx`는 호출자가 알던 값이며, 문서와 다르면 쓰지 않고 `mismatch`로 거절함. */
export function appendConsultationMessage(
  target: ConsultationTarget & { threadIdx: number },
  input: Omit<AppendInput, "expected" | "now">,
) {
  return run(target, (consultation, account) =>
    planAppendMessage(consultation, account, {
      ...input,
      expected: { sequence: target.sequence, threadIdx: target.threadIdx },
      now: Date.now(),
    }),
  );
}

export const cancelRealtimeRequest = (target: ConsultationTarget) =>
  run(target, (consultation) => planCancelRequest(consultation, Date.now()));

export const markRealtimeRequestExpired = (target: ConsultationTarget) =>
  run(target, (consultation) => planMarkExpired(consultation, Date.now()));

export const acquireConsultationLock = (
  target: ConsultationTarget,
  lock: Lock,
) =>
  run(target, (_consultation, account) =>
    planAcquireLock(account, lock, target.sequence, Date.now()),
  );

export const releaseConsultationLock = (
  target: ConsultationTarget,
  lock: Lock,
) =>
  run(target, (_consultation, account) =>
    planReleaseLock(account, lock, Date.now()),
  );

interface CloseArgs {
  /** REST 종료 호출. 이미 종료됐다는 응답도 성공으로 돌려줘야 함. */
  closeRest: () => Promise<void>;
}

/**
 * 종료: ①전송 차단 표시 ②REST 종료 ③종료 메시지·`finishTime` 확정. ②가 실패하면 ①을 남겨 둔 채
 * 오류를 던짐(같은 호출을 다시 하면 ②부터 이어짐). REST에서 아직 열려 있음을 확인했다면
 * `abortConsultationClose`로 전송을 되살림. ③만 실패해도 REST는 다시 보내지 않고 ③만 다시 하면 됨.
 */
export async function closeConsultation(
  target: ConsultationTarget,
  { closeRest }: CloseArgs,
) {
  const begun = await run(target, (consultation) =>
    planBeginClose(consultation, Date.now()),
  );
  if (!begun.ok) return begun;
  await closeRest();
  return finishConsultationClose(target);
}

export function finishConsultationClose(target: ConsultationTarget) {
  return run(target, (consultation) =>
    planFinishClose(consultation, {
      // 같은 상담의 종료 메시지는 하나만 남도록 식별자를 고정함.
      closeMessageId: `close:${target.sequence}`,
      now: Date.now(),
    }),
  );
}

/** 요청 실패한 상담을 같은 문의로 다시 요청함. `alarm`은 운영 앱 알림 내용(`createRealtimeRequest`와 같은 형식). */
export const retryRealtimeRequest = (
  target: ConsultationTarget,
  alarm: Fields | null,
) =>
  run(target, (consultation) =>
    planRetryRequest(consultation, { alarm, now: Date.now() }),
  );

export const abortConsultationClose = (target: ConsultationTarget) =>
  run(target, (consultation) => planAbortClose(consultation));

/** 실시간 상담 요청 문서를 만듦. 같은 `sequence`가 이미 있으면 만들지 않고 skipped로 돌려줌. */
export async function createRealtimeRequest(
  input: CreateRequestInput,
): Promise<{ skipped: boolean }> {
  const target = {
    threadUserIdx: input.threadUserIdx,
    sequence: input.sequence,
  };
  const { db, runTransaction, account, consultation } = await refs(target);
  return runTransaction(db, async (tx) => {
    const [consultationSnap, accountSnap] = await Promise.all([
      tx.get(consultation),
      tx.get(account),
    ]);
    const plan = planCreateRequest(
      consultationSnap.exists()
        ? (consultationSnap.data() as ConsultationDoc)
        : undefined,
      accountSnap.exists() ? (accountSnap.data() as Fields) : undefined,
      input,
    );
    if (!plan) return { skipped: true };
    tx.set(consultation, plan.consultation);
    if (plan.createAccount) {
      // v2 `createChatCollection`과 같은 초기값 위에 요청 값을 얹음.
      tx.set(account, {
        adminClose: false,
        adminResponseUserIdx: null,
        clientResponseUserIdx: null,
        userIdx: input.userIdx,
        created: plan.account.updated,
        ...plan.account,
      });
    } else {
      tx.update(account, plan.account);
    }
    return { skipped: false };
  });
}
