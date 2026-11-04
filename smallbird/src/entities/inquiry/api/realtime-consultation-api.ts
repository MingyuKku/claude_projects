import useSWRSubscription from "swr/subscription";

import { getFirestoreDb } from "@/shared/api";

import { isOtherDeviceError } from "../lib/other-device";
import { parseWriteTime } from "../lib/realtime-phase";
import { transformRealtimeConsultationMessages } from "../lib/transform-inquiry";
import { realtimeConsultationSchema } from "../model/schema";

import type {
  InquiryMessageViewModel,
  RealtimeConsultation,
} from "../model/schema";

// 같은 화면에서 상담 문서·계정 문서 구독이 동시에 시작돼 SDK 모듈을 한 번만 불러옴.
const importFirestore = () => import("firebase/firestore");
let firestoreModule: ReturnType<typeof importFirestore> | undefined;

function loadFirestore() {
  firestoreModule ??= importFirestore();
  return Promise.all([getFirestoreDb(), firestoreModule]);
}

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
  const [db, { doc, onSnapshot }] = await loadFirestore();
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
      // 일반 문의 문서에는 이 필드가 없어 있을 때만 맞는지 봄.
      if (
        (parsed.data.sequence != null && parsed.data.sequence !== sequence) ||
        (parsed.data.threadIdx != null && parsed.data.threadIdx !== threadIdx)
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
      (cause) => {
        console.error("실시간 상담 문서 구독 오류", selectedSequence, cause);
        next(cause);
      },
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
    /** 다른 기기가 이 채팅방을 쥐고 있어 읽기가 막힘(채팅방 잠금). */
    isOtherDevice: isOtherDeviceError(error),
  };
}

type DocumentKey = readonly [
  "realtime-consultation-document",
  number,
  number,
  number,
];

/**
 * 상담 문서 하나를 있는 그대로 구독함(구매자·인플루언서 문의의 연결 판단·변경 신호용). `sequence`가 없으면 구독하지 않음.
 * 문서를 읽지 못하면(없음·권한) `isError`이고, 다른 기기가 방을 쥐어 권한이 막힌 경우는 `isOtherDevice`.
 */
export function useConsultationDocument(
  threadUserIdx: number,
  sequence: number | undefined,
  threadIdx: number,
) {
  const key: DocumentKey | null =
    sequence === undefined
      ? null
      : ["realtime-consultation-document", threadUserIdx, sequence, threadIdx];
  const { data, error } = useSWRSubscription<
    RealtimeConsultation,
    Error,
    DocumentKey | null
  >(key, ([, userIdx, selectedSequence, selectedThreadIdx], { next }) => {
    let isDisposed = false;
    let unsubscribe: (() => void) | undefined;
    void watchConsultation(
      userIdx,
      { sequence: selectedSequence, threadIdx: selectedThreadIdx },
      (consultation) => next(null, consultation),
      (cause) => {
        console.error("상담 문서 구독 오류", selectedSequence, cause);
        next(cause);
      },
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
    consultation: data,
    isLoading: sequence !== undefined && data === undefined && !error,
    isError: Boolean(error),
    isOtherDevice: isOtherDeviceError(error),
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

type AccountKey = readonly ["helpdesk-account-response", number];

/**
 * 요청자 계정 문서(`helpdesk/0.0.2/threadUserIdx/{내}`)의 `msgResponseDate`를 ms로 구독함. 실시간 연결 판단용이라
 * 진행 중인 실시간 상담이 있을 때만 구독함. 값이 없거나 읽지 못하면 null.
 */
export function useAccountResponseAt(threadUserIdx: number, enabled: boolean) {
  const key: AccountKey | null = enabled
    ? ["helpdesk-account-response", threadUserIdx]
    : null;
  const { data } = useSWRSubscription<number | null, Error, AccountKey | null>(
    key,
    ([, userIdx], { next }) => {
      let isDisposed = false;
      let unsubscribe: (() => void) | undefined;
      const handleError = (cause: unknown) => {
        if (!isDisposed) console.error("계정 문서 구독 실패", userIdx, cause);
      };
      void loadFirestore()
        .then(([db, { doc, onSnapshot }]) => {
          if (isDisposed) return;
          unsubscribe = onSnapshot(
            doc(db, "helpdesk", "0.0.2", "threadUserIdx", String(userIdx)),
            (snapshot) =>
              next(null, parseWriteTime(snapshot.get("msgResponseDate"))),
            handleError,
          );
        })
        .catch(handleError);
      return () => {
        isDisposed = true;
        unsubscribe?.();
      };
    },
  );
  return data ?? null;
}
