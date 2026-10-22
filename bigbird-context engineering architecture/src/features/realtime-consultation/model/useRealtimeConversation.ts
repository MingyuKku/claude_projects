import { tryit } from "radash";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  acquireConsultationLock,
  appendConsultationMessage,
  buildRequestAlarm,
  cancelRealtimeRequest,
  closeBigbirdInquiry,
  closeConsultation,
  getAttachmentKind,
  LOCK_REFRESH_MS,
  markRealtimeRequestExpired,
  newMessageId,
  releaseConsultationLock,
  retryRealtimeRequest,
  TAB_ID,
  uploadInquiryAttachment,
} from "@/entities/inquiry";
import { useTranslation } from "@/shared/i18n";

import type { BigbirdInquiryViewModel } from "@/entities/inquiry";
import type { SessionViewModel } from "@/entities/session";

export type LockState = "inactive" | "acquiring" | "held" | "blocked" | "error";

interface Options {
  inquiry: BigbirdInquiryViewModel | undefined;
  session: Pick<
    SessionViewModel,
    "userIdx" | "accountIdx" | "threadUserIdx" | "identifier"
  >;
  enabled: boolean;
  /** 쓰기 뒤 목록(REST)을 다시 읽음. */
  onChanged: () => void;
  /** 일반 문의 전환: 요청을 취소한 뒤 새 문의 화면으로 보냄. */
  onLeaveForMessage: (campaignIdx: number | null) => void;
}

const REASON_KEY = {
  finished: "closed",
  closing: "closing",
  canceled: "closed",
  expired: "closed",
  "not-connected": "notConnected",
  "lock-lost": "lockLost",
  connected: "alreadyConnected",
  mismatch: "failed",
  missing: "failed",
} as const;

/**
 * 실시간 상담 화면의 쓰기 동작: 응대 락(획득·갱신·해제), 전송, 종료, 재시도, 일반 문의 전환, 만료 기록,
 * 연결 후 무응답 자동 종료. 실제 쓰기 규칙은 entities/inquiry의 트랜잭션 함수가 지킴.
 */
export function useRealtimeConversation({
  inquiry,
  session,
  enabled,
  onChanged,
  onLeaveForMessage,
}: Options) {
  const { t } = useTranslation("features/realtime-consultation");
  // 락 결과는 비동기 콜백에서만 기록함. 상담이 바뀌면 키가 달라져 자동으로 "확인 중"이 됨.
  const [lockResult, setLockResult] = useState<{
    key: string;
    state: "held" | "blocked" | "error";
  } | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const pendingMessage = useRef<{ text: string; id: string } | null>(null);
  // 업로드와 저장 중 어느 쪽이 실패했는지에 따라 다시 보낼 때 업로드·메시지 식별자를 재사용함.
  const pendingFiles = useRef(
    new WeakMap<
      File,
      {
        uploaded: Awaited<ReturnType<typeof uploadInquiryAttachment>>;
        id: string;
      }
    >(),
  );

  const sequence = inquiry?.sequence;
  const threadIdx = inquiry?.threadIdx;
  const phase = inquiry?.realtimePhase ?? null;
  const isLive =
    enabled && Boolean(inquiry?.isRealtime) && !inquiry?.isFinished;
  const owner = `${session.userIdx}_${session.accountIdx}`;
  const { threadUserIdx } = session;
  const target = sequence === undefined ? null : { threadUserIdx, sequence };
  const lockKey = `${threadUserIdx}:${sequence}:${owner}`;
  const lock: LockState = !isLive
    ? "inactive"
    : lockResult?.key === lockKey
      ? lockResult.state
      : "acquiring";

  // 락: 상담을 보는 동안 내 탭의 만료를 주기적으로 연장하고, 떠날 때 내 탭만 뺌.
  useEffect(() => {
    if (!isLive || sequence === undefined) return;
    const lockTarget = { threadUserIdx, sequence };
    const tab = { owner, tabId: TAB_ID };
    let isDisposed = false;
    let hasLock = false;
    // 다른 계정이 락을 쥐어 명시적으로 거절됐을 때만 갱신을 멈춤. 일시 오류는 다음 주기에 다시 시도함.
    let isRejected = false;

    async function acquire() {
      const [error, result] = await tryit(acquireConsultationLock)(
        lockTarget,
        tab,
      );
      if (isDisposed) {
        // 화면을 떠난 뒤에 응답이 와서 락을 얻었다면 바로 놓음(해제 단계가 이미 지나감).
        if (!error && result.ok)
          void tryit(releaseConsultationLock)(lockTarget, tab);
        return;
      }
      if (error) console.error("응대 락 확인 실패", error);
      else {
        isRejected = !result.ok;
        if (result.ok) hasLock = true;
      }
      setLockResult({
        key: lockKey,
        state: error ? "error" : result.ok ? "held" : "blocked",
      });
    }

    void acquire();
    const timer = setInterval(() => {
      if (!isRejected) void acquire();
    }, LOCK_REFRESH_MS);
    return () => {
      isDisposed = true;
      clearInterval(timer);
      if (hasLock)
        void tryit(releaseConsultationLock)(lockTarget, tab).then(([error]) => {
          if (error) console.error("응대 락 해제 실패", error);
        });
    };
  }, [isLive, sequence, threadUserIdx, owner, lockKey]);

  // 락 확인이 일시 오류로 실패하면 입력창이 비활성이 되므로 이유를 알림. 같은 오류가 이어지는 동안은
  // 한 번만 알리고, 다음 갱신에서 복구되면 입력이 다시 활성화됨.
  useEffect(() => {
    if (lock === "error") toast.error(t("lockCheckFailed"));
  }, [lock, t]);

  // 요청 실패(마감 경과)한 v3 요청에 만료를 기록함. 운영 앱이 뒤늦게 연결하지 못하게 함.
  const expiredKey = useRef<string | null>(null);
  // 만료 기록이 실패하면 잠시 뒤 같은 마감값으로 다시 시도함.
  const [expireAttempt, setExpireAttempt] = useState(0);
  const connectDeadlineAt = inquiry?.connectDeadlineAt;
  useEffect(() => {
    if (!isLive || sequence === undefined) return;
    if (phase !== "failed" || lock !== "held") return;
    const key = `${sequence}:${connectDeadlineAt}`;
    if (expiredKey.current === key) return;
    expiredKey.current = key;
    void tryit(markRealtimeRequestExpired)({ threadUserIdx, sequence }).then(
      ([error]) => {
        if (!error) return;
        console.error("요청 만료 기록 실패", error);
        setTimeout(() => {
          expiredKey.current = null;
          setExpireAttempt((count) => count + 1);
        }, LOCK_REFRESH_MS);
      },
    );
  }, [
    isLive,
    phase,
    lock,
    sequence,
    threadUserIdx,
    connectDeadlineAt,
    expireAttempt,
  ]);

  async function end(): Promise<boolean> {
    if (!target || threadIdx === undefined || isBusy) return false;
    setIsBusy(true);
    try {
      const [error, result] = await tryit(closeConsultation)(target, {
        closeRest: () => closeBigbirdInquiry(threadIdx),
      });
      if (error || !result.ok) {
        if (error) console.error("실시간 상담 종료 실패", error);
        toast.error(t("endFailed"));
        return false;
      }
      onChanged();
      return true;
    } finally {
      setIsBusy(false);
    }
  }

  // 연결 후 3분 동안 광고주가 말하지 않으면 자동 종료함(기존 스펙). 락을 가진 탭만 실행함.
  const idleDeadline = inquiry?.idleDeadlineAt ?? null;
  const endRef = useRef(end);
  useEffect(() => {
    endRef.current = end;
  });
  useEffect(() => {
    if (!isLive || lock !== "held" || phase !== "connected") return;
    if (idleDeadline === null) return;
    const timer = setTimeout(
      () => void endRef.current(),
      Math.max(0, idleDeadline - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [isLive, lock, phase, idleDeadline]);

  async function send(text: string): Promise<boolean> {
    const body = text.trim();
    if (!target || threadIdx === undefined || !body) return false;
    // 응답이 유실돼 같은 글을 다시 보내면 같은 식별자로 보내 중복 저장을 막음.
    const pending =
      pendingMessage.current?.text === body
        ? pendingMessage.current
        : { text: body, id: newMessageId() };
    pendingMessage.current = pending;
    const [error, result] = await tryit(appendConsultationMessage)(
      { ...target, threadIdx },
      {
        requireConnected: false,
        lock: { owner, tabId: TAB_ID },
        message: {
          auto: false,
          attachmentIdx: null,
          identifier: session.identifier,
          isUserMessage: true,
          body,
          fileName: null,
          messageId: pending.id,
        },
      },
    );
    if (error) {
      console.error("실시간 상담 메시지 전송 실패", error);
      toast.error(t("sendFailed"));
      return false;
    }
    if (!result.ok) {
      toast.error(t(REASON_KEY[result.reason]));
      pendingMessage.current = null;
      return false;
    }
    pendingMessage.current = null;
    return true;
  }

  /**
   * 파일을 모두 올린 뒤 첨부 메시지를 한 번에 저장해 대화에 한꺼번에 나타나게 함. 실패하면 false이고, 같은
   * 파일들로 다시 부르면 이미 올린 것은 다시 올리지 않고 같은 messageId로 이어서 보냄.
   */
  async function sendFiles(files: readonly File[]): Promise<boolean> {
    if (!target || threadIdx === undefined || files.length === 0) return false;
    const messages = [];
    for (const file of files) {
      const kind = getAttachmentKind(file);
      if (!kind) return false;
      let pending = pendingFiles.current.get(file);
      if (!pending) {
        const [uploadError, uploaded] = await tryit(uploadInquiryAttachment)(
          file,
        );
        if (uploadError) {
          console.error("실시간 상담 첨부 업로드 실패", uploadError);
          toast.error(t("sendFailed"));
          return false;
        }
        pending = { uploaded, id: newMessageId() };
        pendingFiles.current.set(file, pending);
      }
      messages.push({
        auto: false,
        attachmentIdx: pending.uploaded.attachmentIdx,
        identifier: session.identifier,
        isUserMessage: true,
        body: pending.uploaded.url,
        // 운영 앱이 video를 `이름.확장자`로 쪼개 읽으므로 확장자가 있는 이름을 둠.
        fileName: pending.uploaded.fileName || file.name,
        fileType: kind,
        messageId: pending.id,
      });
    }
    const [error, result] = await tryit(appendConsultationMessage)(
      { ...target, threadIdx },
      {
        requireConnected: false,
        lock: { owner, tabId: TAB_ID },
        message: messages,
      },
    );
    if (error) {
      console.error("실시간 상담 첨부 전송 실패", error);
      toast.error(t("sendFailed"));
      return false;
    }
    if (!result.ok) {
      toast.error(t(REASON_KEY[result.reason]));
      for (const file of files) pendingFiles.current.delete(file);
      return false;
    }
    for (const file of files) pendingFiles.current.delete(file);
    return true;
  }

  async function retry(): Promise<void> {
    if (!target || isBusy) return;
    setIsBusy(true);
    try {
      const alarm = buildRequestAlarm(
        {
          threadUserIdx: session.threadUserIdx,
          userIdx: session.userIdx,
          userId: session.identifier,
          campaign: null,
        },
        inquiry?.campaignIdx ?? null,
        new Date().toISOString(),
      );
      const [error, result] = await tryit(retryRealtimeRequest)(target, alarm);
      if (error) {
        console.error("실시간 상담 재요청 실패", error);
        toast.error(t("retryFailed"));
        return;
      }
      if (!result.ok) {
        toast.error(t(REASON_KEY[result.reason]));
        return;
      }
      // 새 마감은 Firestore 구독으로 들어오고, 화면이 다시 "요청 중"이 됨.
      expiredKey.current = null;
    } finally {
      setIsBusy(false);
    }
  }

  async function leaveForMessage(): Promise<void> {
    if (!target || threadIdx === undefined || isBusy) return;
    setIsBusy(true);
    try {
      // ①요청 취소(운영의 늦은 연결 차단). 이미 연결됐으면 상담으로 돌아감.
      const [cancelError, canceled] = await tryit(cancelRealtimeRequest)(
        target,
      );
      if (cancelError) {
        console.error("실시간 상담 요청 취소 실패", cancelError);
        toast.error(t("cancelFailed"));
        return;
      }
      if (!canceled.ok) {
        toast.error(t(REASON_KEY[canceled.reason]));
        return;
      }
      // ②REST에 열려 있는 요청 정리. 실패해도 취소는 확정됐으므로 일반 문의 작성으로 넘어감.
      const [closeError] = await tryit(closeConsultation)(target, {
        closeRest: () => closeBigbirdInquiry(threadIdx),
      });
      if (closeError) console.error("취소한 요청 정리 실패", closeError);
      onChanged();
      onLeaveForMessage(inquiry?.campaignIdx ?? null);
    } finally {
      setIsBusy(false);
    }
  }

  return {
    lock,
    isBusy,
    // 요청 중에도 미리 보낼 수 있음. 요청 실패·종료 뒤에는 막음.
    canSend:
      lock === "held" && (phase === "requesting" || phase === "connected"),
    send,
    sendFiles,
    end,
    retry,
    leaveForMessage,
  };
}
