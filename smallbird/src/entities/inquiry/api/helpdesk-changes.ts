import { useEffect, useRef } from "react";

import { getFirestoreDb } from "@/shared/api";

import { realtimeAlarmSchema } from "../model/schema";

import type { RealtimeAlarm } from "../model/schema";

/**
 * 내 문의 요약(`summary/{sequence}`) 중 화면을 연 뒤 메시지가 생긴 것이 바뀌면 `onChange`를 부름. 목록 화면에 있는 동안만.
 * 운영자 답장·상태 변경 때 백엔드가 summary(와 sequence)를 갱신함(2026-10-28 백엔드 합의). 내용은 읽지 않고 REST를
 * 다시 받는 신호로만 씀(Firestore 메시지에는 수정·삭제·읽음 정보가 없어 화면 원본은 REST로 둠).
 *
 * 읽기 줄이기(2026-10-29, dev 일일 읽기 한도 초과): 예전에는 summary 컬렉션 전체를 구독해 구독할 때마다(화면 진입·
 * 상태 탭 변경) 문서 수만큼 읽었음. 이제 `lastMessageAt`이 화면을 연 시각 이후인 문서만 구독해 첫 스냅숏은 보통
 * 0건(쿼리 최소 1회 과금)이고, 콜백은 ref로 바꿔 끼워 탭을 바꿔도 다시 구독하지 않음.
 * ponytail: 메시지 없이 상태만 바뀌는 변경(일반 문의 10분 자동 종료 등)은 신호가 오지 않아, 화면 포커스 때의 재조회와
 * 실시간 상담 문서 구독으로 따라잡음. 바로 보여야 하면 백엔드가 그때도 `lastMessageAt`과 같은 갱신 시각 필드를 써야 함.
 */
export function useInquirySummaryChanges(
  threadUserIdx: number | undefined,
  onChange: () => void,
) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (threadUserIdx === undefined) return;
    const path = `helpdesk/0.0.2/threadUserIdx/${threadUserIdx}/summary`;
    const openedAt = new Date();
    let isDisposed = false;
    let unsubscribe: (() => void) | undefined;
    let isFirst = true;

    function handleSnapshot() {
      if (isFirst) {
        isFirst = false;
        return;
      }
      onChangeRef.current();
    }

    // 보안 규칙 등으로 구독이 실패해도 REST 목록·새로고침은 그대로 쓸 수 있어 로그만 남김.
    function handleError(cause: unknown) {
      if (!isDisposed) console.error("헬프데스크 변경 구독 실패", path, cause);
    }

    void Promise.all([getFirestoreDb(), import("firebase/firestore")])
      .then(([db, { collection, onSnapshot, query, Timestamp, where }]) => {
        if (isDisposed) return;
        unsubscribe = onSnapshot(
          query(
            collection(db, path),
            where("lastMessageAt", ">", Timestamp.fromDate(openedAt)),
          ),
          handleSnapshot,
          handleError,
        );
      })
      .catch(handleError);
    return () => {
      isDisposed = true;
      unsubscribe?.();
    };
  }, [threadUserIdx]);
}

/**
 * 구매자 문의는 Firestore 문서가 구매자 계정(`threadUserIdx/{구매자}`)마다 있어 광고주 summary로는 변경을 알 수 없음.
 * 목록에 보이는 구매자 계정 문서를 하나씩 구독하고, 메시지가 오가며 문서가 바뀌면 `onChange`를 부름(REST 재조회 신호).
 * 목록이 바뀌어도 이미 구독한 계정은 다시 구독하지 않아 읽기는 계정당 처음 1회 + 변경 때만 듦.
 * ponytail: 목록에 아직 없는 새 구매자의 첫 문의는 신호가 없어 화면 포커스·새로고침 때 보임. 바로 보여야 하면
 * 백엔드가 광고주 계정 아래(summary 등)에 신호를 써야 함.
 */
export function useBuyerAccountChanges(
  threadUserIdxs: readonly number[],
  onChange: () => void,
  /** 새 실시간 상담 요청 알림(`alarmData`)이 생겼을 때. 구독 전부터 있던 알림은 부르지 않음. */
  onRealtimeAlarm?: (threadUserIdx: number, alarm: RealtimeAlarm) => void,
) {
  const onChangeRef = useRef(onChange);
  const onAlarmRef = useRef(onRealtimeAlarm);
  useEffect(() => {
    onChangeRef.current = onChange;
    onAlarmRef.current = onRealtimeAlarm;
  });
  const watched = useRef(new Map<number, () => void>());
  const signature = [...new Set(threadUserIdxs)].sort().join(",");

  useEffect(() => {
    const ids = signature ? signature.split(",").map(Number) : [];
    const subscriptions = watched.current;
    for (const [id, stop] of subscriptions) {
      if (!ids.includes(id)) {
        stop();
        subscriptions.delete(id);
      }
    }
    for (const id of ids) {
      if (subscriptions.has(id)) continue;
      const path = `helpdesk/0.0.2/threadUserIdx/${id}`;
      let isDisposed = false;
      let unsubscribe: (() => void) | undefined;
      let isFirst = true;
      let lastAlarm: string | null = null;
      subscriptions.set(id, () => {
        isDisposed = true;
        unsubscribe?.();
      });
      // 구독이 실패해도 REST 목록·새로고침은 그대로 쓸 수 있어 로그만 남김.
      const handleError = (cause: unknown) => {
        if (!isDisposed)
          console.error("구매자 계정 변경 구독 실패", path, cause);
      };
      void Promise.all([getFirestoreDb(), import("firebase/firestore")])
        .then(([db, { doc, onSnapshot }]) => {
          if (isDisposed) return;
          unsubscribe = onSnapshot(
            doc(db, path),
            (snapshot) => {
              const alarm = realtimeAlarmSchema.safeParse(
                snapshot.get("alarmData"),
              );
              const alarmKey = alarm.success
                ? JSON.stringify(alarm.data)
                : null;
              const isNewAlarm = alarmKey !== null && alarmKey !== lastAlarm;
              lastAlarm = alarmKey;
              if (isFirst) {
                isFirst = false;
                return;
              }
              if (isNewAlarm && alarm.success)
                onAlarmRef.current?.(id, alarm.data);
              onChangeRef.current();
            },
            handleError,
          );
        })
        .catch(handleError);
    }
  }, [signature]);

  useEffect(() => {
    const subscriptions = watched.current;
    return () => {
      subscriptions.forEach((stop) => stop());
      subscriptions.clear();
    };
  }, []);
}
