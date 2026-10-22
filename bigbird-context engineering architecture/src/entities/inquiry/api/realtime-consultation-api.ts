import useSWRSubscription from "swr/subscription";

import { getFirestoreDb } from "@/shared/api";

import { transformRealtimeConsultationMessages } from "../lib/transform-inquiry";
import { realtimeConsultationSchema } from "../model/schema";

import type {
  InquiryMessageViewModel,
  RealtimeConsultation,
} from "../model/schema";

interface ConsultationTarget {
  sequence: number;
  threadIdx: number;
}

/**
 * 상담 문서(`helpdesk/0.0.2/threadUserIdx/{내}/sequence/{sequence}`) 하나를 구독함. 내 문서만 읽고,
 * REST가 준 `sequence`·`threadIdx`와 다른 문서는 오류로 다룸(운영 앱도 이 값을 믿음).
 * 구독 해제 함수를 돌려주며, 해제된 뒤에는 콜백을 부르지 않음.
 */
async function watchConsultation(
  threadUserIdx: number,
  { sequence, threadIdx }: ConsultationTarget,
  onData: (consultation: RealtimeConsultation) => void,
  onError: (error: Error) => void,
): Promise<() => void> {
  const [db, { doc, onSnapshot }] = await Promise.all([
    getFirestoreDb(),
    import("firebase/firestore"),
  ]);
  let isClosed = false;
  const unsubscribe = onSnapshot(
    doc(
      db,
      "helpdesk",
      "0.0.2",
      "threadUserIdx",
      String(threadUserIdx),
      "sequence",
      String(sequence),
    ),
    (snapshot) => {
      if (isClosed) return;
      if (!snapshot.exists()) {
        onError(new Error("실시간 상담 문서가 없습니다."));
        return;
      }
      const parsed = realtimeConsultationSchema.safeParse(snapshot.data());
      if (!parsed.success) {
        onError(parsed.error);
        return;
      }
      if (
        parsed.data.sequence !== sequence ||
        parsed.data.threadIdx !== threadIdx
      ) {
        onError(new Error("실시간 상담 식별자가 일치하지 않습니다."));
        return;
      }
      onData(parsed.data);
    },
    (cause) => {
      if (!isClosed) onError(cause);
    },
  );
  return () => {
    isClosed = true;
    unsubscribe();
  };
}

function toError(cause: unknown) {
  return cause instanceof Error ? cause : new Error(String(cause));
}

type MessagesKey = readonly ["realtime-consultation", number, number, number];

/** 선택한 실시간 상담 문서 하나만 구독함. 종료된 상담도 문서에서 빠지지 않음. */
export function useRealtimeConsultationMessages(
  threadUserIdx: number,
  sequence: number | undefined,
  threadIdx: number,
) {
  const key: MessagesKey | null =
    sequence === undefined
      ? null
      : ["realtime-consultation", threadUserIdx, sequence, threadIdx];
  const { data, error } = useSWRSubscription<
    InquiryMessageViewModel[],
    Error,
    MessagesKey | null
  >(key, ([, userIdx, selectedSequence, selectedThreadIdx], { next }) => {
    let isDisposed = false;
    let unsubscribe: (() => void) | undefined;
    void watchConsultation(
      userIdx,
      { sequence: selectedSequence, threadIdx: selectedThreadIdx },
      (consultation) =>
        next(null, transformRealtimeConsultationMessages(consultation)),
      (cause) => next(cause),
    )
      .then((stop) => {
        if (isDisposed) stop();
        else unsubscribe = stop;
      })
      .catch((cause: unknown) => {
        if (!isDisposed) next(toError(cause));
      });
    return () => {
      isDisposed = true;
      unsubscribe?.();
    };
  });

  return {
    messages: data,
    isLoading: sequence !== undefined && data === undefined && !error,
    isError: Boolean(error),
  };
}

type StatesKey = readonly ["realtime-consultation-states", number, string];

/**
 * 목록에서 아직 종료되지 않은 실시간 상담들의 연결·종료 상태를 구독함(상담 중·요청 실패 표시용).
 * 내 문서 중 REST가 열려 있다고 한 것만 구독하므로 보통 1건. 반환은 `threadIdx` → 문서.
 */
export function useRealtimeConsultationStates(
  threadUserIdx: number,
  targets: readonly ConsultationTarget[],
) {
  const signature = targets
    .map(({ sequence, threadIdx }) => `${sequence}:${threadIdx}`)
    .sort()
    .join(",");
  const key: StatesKey | null =
    targets.length === 0
      ? null
      : ["realtime-consultation-states", threadUserIdx, signature];
  const { data } = useSWRSubscription<
    Record<number, RealtimeConsultation>,
    Error,
    StatesKey | null
  >(key, ([, userIdx, joined], { next }) => {
    const subscribed: ConsultationTarget[] = joined.split(",").map((pair) => {
      const [sequence = 0, threadIdx = 0] = pair.split(":").map(Number);
      return { sequence, threadIdx };
    });
    let isDisposed = false;
    const stops: (() => void)[] = [];
    let latest: Record<number, RealtimeConsultation> = {};
    for (const target of subscribed) {
      void watchConsultation(
        userIdx,
        target,
        (consultation) => {
          latest = { ...latest, [target.threadIdx]: consultation };
          next(null, latest);
        },
        // 한 건이 실패해도 나머지 상태는 그대로 둠. 상태를 모르는 건은 REST 값으로 보임.
        (cause) => console.error("실시간 상담 상태 구독 실패", cause),
      )
        .then((stop) => {
          if (isDisposed) stop();
          else stops.push(stop);
        })
        .catch((cause: unknown) =>
          console.error("실시간 상담 상태 구독 실패", cause),
        );
    }
    return () => {
      isDisposed = true;
      stops.forEach((stop) => stop());
    };
  });
  return data ?? {};
}
