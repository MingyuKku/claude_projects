import {
  REALTIME_END_NOTICES,
  REALTIME_REQUEST_MESSAGE,
} from "./consultation-write";
import { isConsultationConnected, parseWriteTime } from "./realtime-phase";

import type {
  InquiryMessageViewModel,
  RealtimeConsultation,
} from "../model/schema";

/** 대화 안에 그리는 실시간 상담의 시작·종료 줄. `at`은 ms. */
export interface RealtimeLine {
  kind: "start" | "end";
  at: number;
}

interface Session {
  requestAt: number;
  /** 연결(수락)된 시각. 연결되지 않은 상담은 null. */
  startAt: number | null;
  endAt: number | null;
}

// 상담 문서 메시지의 시각은 초 단위이고 수락 시각(acceptedAt)은 밀리초라, 같은 초끼리 비교해야 첫 메시지 앞에 놓임.
const toSecond = (ms: number) => Math.floor(ms / 1000);

// 요청 안내(auto)와 문서의 요청 시각(matchRequestedAt)이 같은 상담인지 보는 허용 오차(초).
const SAME_REQUEST_TOLERANCE_SECONDS = 2;

// 서버가 같은 종료를 알리며 남기는 안내가 REST에도 있을 수 있어, 이 시간 안의 REST 종료 안내는 같은 종료로 봄(초).
const SAME_END_TOLERANCE_SECONDS = 3;

const START_ID_BASE = -3_000_000;

/**
 * 상담 문서에서 상담마다 시작·종료 줄을 뽑음. 문서 하나에 같은 스레드의 상담이 여러 번 쌓이므로 요청 안내(auto)로 상담을
 * 나눔. 시작은 연결된 상담에만 한 번, 종료는 연결된 상담의 종료 안내(auto)가 있을 때만 한 번 둠.
 * - 연결: 요청자가 아닌 쪽(`isUserMessage === false`)의 첫 글 시각. 마지막 상담은 문서의 `acceptedAt`이 더 빠르면 그 시각
 *   (문서는 마지막 상담의 수락 시각만 가짐).
 * - 종료: 요청 뒤 첫 종료 안내(auto)의 시각. 안내가 없는 상담(진행 중·안내 없이 끝남)은 종료 줄이 없음.
 * 요청 안내가 없는 옛 문서는 상담을 나눌 수 없어 줄이 없음.
 */
export function deriveRealtimeLines(
  consultation: RealtimeConsultation,
): RealtimeLine[] {
  const entries = consultation.messages
    .map((message) => ({ message, at: parseWriteTime(message.created) }))
    .filter(
      (entry): entry is { message: typeof entry.message; at: number } =>
        entry.at !== null,
    )
    .sort((a, b) => a.at - b.at);

  const sessions: Session[] = [];
  let open: Session | null = null;
  for (const { message, at } of entries) {
    if (message.auto) {
      const body = message.body.trim();
      if (body === REALTIME_REQUEST_MESSAGE) {
        open = { requestAt: at, startAt: null, endAt: null };
        sessions.push(open);
      } else if (open && REALTIME_END_NOTICES.includes(body)) {
        open.endAt = at;
        open = null;
      }
      continue;
    }
    // 일반 문의(`mode: general`)로 쓴 글은 연결로 보지 않음: 끝나지 않고 남은 요청 뒤의 일반 답장이 "시작" 줄을 만들던 문제(2026-11-12).
    if (
      open &&
      open.startAt === null &&
      message.isUserMessage === false &&
      message.mode !== "general"
    ) {
      open.startAt = at;
    }
  }

  const last = sessions.at(-1);
  const matchRequestedAt = parseWriteTime(consultation.matchRequestedAt);
  const acceptedAt = parseWriteTime(consultation.acceptedAt);
  if (
    last &&
    matchRequestedAt !== null &&
    acceptedAt !== null &&
    isConsultationConnected(consultation) &&
    Math.abs(toSecond(last.requestAt) - toSecond(matchRequestedAt)) <=
      SAME_REQUEST_TOLERANCE_SECONDS
  ) {
    last.startAt = Math.min(acceptedAt, last.startAt ?? acceptedAt);
  }

  return sessions.flatMap((session) => {
    if (session.startAt === null) return [];
    const lines: RealtimeLine[] = [{ kind: "start", at: session.startAt }];
    if (session.endAt !== null && session.endAt >= session.startAt)
      lines.push({ kind: "end", at: session.endAt });
    return lines;
  });
}

/**
 * 시간순 `messages`에 시작·종료 줄을 끼워 넣음. 시작 줄은 같은 초의 메시지보다 앞에, 종료 줄은 같은 초의 메시지보다
 * 뒤에 둠(수락 시각이 첫 메시지와 겹쳐 줄이 메시지 뒤로 밀리지 않게). 같은 시각의 REST 종료 안내는 중복이라 뺌.
 */
export function insertRealtimeLines(
  messages: InquiryMessageViewModel[],
  lines: RealtimeLine[],
  labels: { start: string; end: string },
): InquiryMessageViewModel[] {
  if (lines.length === 0) return messages;
  const endSeconds = lines
    .filter((line) => line.kind === "end")
    .map((line) => toSecond(line.at));
  const result = messages.filter(
    (message) =>
      !(
        message.kind === "notice" &&
        endSeconds.some(
          (second) =>
            Math.abs(toSecond(message.createdAt.getTime()) - second) <=
            SAME_END_TOLERANCE_SECONDS,
        )
      ),
  );
  [...lines]
    .sort((a, b) => a.at - b.at)
    .forEach((line, index) => {
      const second = toSecond(line.at);
      const notice: InquiryMessageViewModel = {
        id: START_ID_BASE - index,
        isMine: false,
        kind: "notice",
        body: line.kind === "start" ? labels.start : labels.end,
        createdAt: new Date(line.at),
        isDeleted: false,
        isRead: false,
        isEdited: false,
        senderId: null,
        campaign: null,
        attachment: null,
      };
      // 시간순이라 위치는 개수로 정함. 시작 줄: 같은 초부터의 첫 메시지 앞(= 더 이른 초의 메시지 수). 종료 줄: 같은 초까지의
      // 메시지 뒤(= 같거나 이른 초의 메시지 수).
      const earlier = result.filter(
        (message) => toSecond(message.createdAt.getTime()) < second,
      ).length;
      const notLater = result.filter(
        (message) => toSecond(message.createdAt.getTime()) <= second,
      ).length;
      result.splice(line.kind === "start" ? earlier : notLater, 0, notice);
    });
  return result;
}
