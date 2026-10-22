import { parseWriteTime, REALTIME_CONNECT_TIMEOUT_MS } from "./realtime-phase";

// 실시간 상담 Firestore 쓰기의 판단 로직. Firestore를 모르는 순수 함수라서, 트랜잭션이 읽은 문서와
// 현재 시각만 받아 "무엇을 쓸지 / 쓰지 말지 / 왜 거절하는지"를 돌려줌. 계약은 specs/customer-center/customer-center.md.

/** 락 탭이 갱신 없이 살아 있다고 보는 시간. 갱신 간격은 이 값의 1/3. */
export const LOCK_TTL_MS = 45_000;
export const LOCK_REFRESH_MS = 15_000;

export type Fields = Record<string, unknown>;

export interface StoredMessage {
  auto: boolean;
  attachmentIdx: number | null;
  identifier: string | null;
  isUserMessage: boolean;
  body: string;
  fileName: string | null;
  fileType?: string | null;
  created: string;
  messageId?: string | null;
}

/** 상담 문서(`sequence/{sequence}`)에서 쓰기 판단에 필요한 필드. */
export interface ConsultationDoc {
  sequence: number;
  threadIdx: number;
  isConnect: boolean;
  finishTime?: string | null;
  closingAt?: string | null;
  canceledAt?: string | null;
  expiredAt?: string | null;
  waitDeadline?: string | null;
  origin?: "v2" | "v3" | null;
  created?: string | null;
  seqResponseDate?: string | null;
  messages?: StoredMessage[] | null;
}

/** 계정 문서(`threadUserIdx/{id}`)의 락 필드. */
export interface AccountDoc {
  clientResponseUserIdx?: string | null;
  clientResponseSequence?: number | null;
  clientResponseTabs?: Record<string, number> | null;
}

export interface Lock {
  /** `"{userIdx}_{accountIdx}"` (v2와 같은 형식). */
  owner: string;
  tabId: string;
}

export type RejectReason =
  | "missing"
  | "mismatch"
  | "finished"
  | "closing"
  | "canceled"
  | "expired"
  | "not-connected"
  | "connected"
  | "lock-lost";

export type Plan =
  | { kind: "write"; consultation?: Fields; account?: Fields }
  /** 이미 반영된 요청(재시도)이라 쓸 것이 없음. 성공으로 다룸. */
  | { kind: "skip" }
  | { kind: "reject"; reason: RejectReason };

const reject = (reason: RejectReason): Plan => ({ kind: "reject", reason });
const pad = (value: number) => String(value).padStart(2, "0");

/** 다른 앱이 읽는 `YYYY-MM-DD HH:mm:ss`(로컬 시각, v2의 moment 형식과 같음). */
export function formatWriteTime(time: number): string {
  const d = new Date(time);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** 연결 대기 마감(ms). 마감 필드가 없는 과거 문서는 요청 시각 + 5분으로 계산함. */
export function getWaitDeadline(doc: ConsultationDoc): number | null {
  const explicit = parseWriteTime(doc.waitDeadline);
  if (explicit !== null) return explicit;
  const requested = parseWriteTime(doc.created ?? doc.seqResponseDate);
  return requested === null ? null : requested + REALTIME_CONNECT_TIMEOUT_MS;
}

/** 취소·만료·종료 중·종료 상태면 이유를, 아니면 null. 메시지 추가·연결의 공통 관문. */
export function getClosedReason(doc: ConsultationDoc): RejectReason | null {
  if (doc.finishTime) return "finished";
  if (doc.closingAt) return "closing";
  if (doc.canceledAt) return "canceled";
  if (doc.expiredAt) return "expired";
  return null;
}

function liveTabs(account: AccountDoc, now: number): Record<string, number> {
  return Object.fromEntries(
    Object.entries(account.clientResponseTabs ?? {}).filter(
      ([, expiresAt]) => expiresAt > now,
    ),
  );
}

/** 내 탭이 락을 갖고 있는지. 전송 직전에 다시 확인함. */
export function holdsLock(
  account: AccountDoc | undefined,
  lock: Lock,
  now: number,
): boolean {
  if (!account || account.clientResponseUserIdx !== lock.owner) return false;
  const expiresAt = account.clientResponseTabs?.[lock.tabId];
  return expiresAt !== undefined && expiresAt > now;
}

type NewMessage = Omit<StoredMessage, "created"> & { messageId: string };

export interface AppendInput {
  /** 호출자가 알던 상담 식별자. 문서와 다르면 다른 상담에 쓰지 않음. */
  expected: { sequence: number; threadIdx: number };
  /** 배열이면 한 번의 쓰기로 모두 붙여 대화에 한꺼번에 나타나게 함(첨부 여러 개). */
  message: NewMessage | NewMessage[];
  /** true면 상담원이 연결된 뒤에만 받음. false면 연결 대기 마감 전의 미리 보낸 메시지도 받음. */
  requireConnected: boolean;
  /** 주면 내 탭이 락을 갖고 있어야 함. */
  lock?: Lock;
  now: number;
}

/**
 * 메시지 하나를 `messages`의 **최신 배열 끝**에 붙이는 계획. 같은 `messageId`가 있으면 건너뛰고,
 * 종료·취소·만료·종료 중이면 거절함. 읽어 둔 배열을 다시 쓰는 일은 없음.
 */
export function planAppendMessage(
  doc: ConsultationDoc | undefined,
  account: AccountDoc | undefined,
  input: AppendInput,
): Plan {
  if (!doc) return reject("missing");
  if (
    doc.sequence !== input.expected.sequence ||
    doc.threadIdx !== input.expected.threadIdx
  )
    return reject("mismatch");
  const messages = doc.messages ?? [];
  const incoming = Array.isArray(input.message)
    ? input.message
    : [input.message];
  // 같은 요청을 다시 보내면(응답 유실) 이미 저장된 것은 건너뜀. 한 번에 쓰므로 일부만 있는 경우는 없음.
  if (
    incoming.some((message) =>
      messages.some((m) => m.messageId === message.messageId),
    )
  )
    return { kind: "skip" };
  const closed = getClosedReason(doc);
  if (closed) return reject(closed);
  if (!doc.isConnect) {
    if (input.requireConnected) return reject("not-connected");
    // 연결 전에 미리 보낸 메시지는 마감 전까지만 받음(마감이 지난 요청은 실패 상태).
    const deadline = getWaitDeadline(doc);
    if (deadline !== null && input.now >= deadline) return reject("expired");
  }
  if (input.lock && !holdsLock(account, input.lock, input.now))
    return reject("lock-lost");

  const stamp = formatWriteTime(input.now);
  const isUserSpeech = incoming.some(
    (message) => message.isUserMessage && !message.auto,
  );
  return {
    kind: "write",
    consultation: {
      messages: [
        ...messages,
        ...incoming.map((message) => ({ ...message, created: stamp })),
      ],
      // 광고주가 말을 걸면 무응답 3분 타이머를 멈춤(v2와 같음).
      ...(isUserSpeech ? { seqResponseDate: null } : {}),
    },
    ...(isUserSpeech
      ? {
          account: {
            threadBoardType: 0,
            newSenderUserIdx: 1,
            msgResponseDate: stamp,
            updated: stamp,
          },
        }
      : {}),
  };
}

/**
 * 연결 대기 중인 요청을 취소함(일반 문의 전환 직전). 이미 연결됐으면 취소하지 않고 거절해서
 * 호출자가 상담으로 돌아가게 함. 같은 요청을 다시 취소하면 건너뜀.
 */
export function planCancelRequest(
  doc: ConsultationDoc | undefined,
  now: number,
): Plan {
  if (!doc) return reject("missing");
  if (doc.canceledAt) return { kind: "skip" };
  if (doc.finishTime) return reject("finished");
  if (doc.closingAt) return reject("closing");
  if (doc.isConnect) return reject("connected");
  return {
    kind: "write",
    consultation: { canceledAt: formatWriteTime(now) },
  };
}

/**
 * 연결 대기 마감이 지난 v3 요청에 만료를 기록함. v2 요청은 종료(away 메시지 + `finishTime`)가
 * 기존 동작이라 여기서 다루지 않음. 연결된 뒤나 이미 끝난 요청은 건드리지 않음.
 */
export function planMarkExpired(
  doc: ConsultationDoc | undefined,
  now: number,
): Plan {
  if (!doc) return reject("missing");
  if (doc.expiredAt) return { kind: "skip" };
  // v2 요청은 v2가 만료 시 종료함. v3가 만료를 기록하면 그 흐름과 겹침.
  if (doc.origin !== "v3") return { kind: "skip" };
  const closed = getClosedReason(doc);
  if (closed || doc.isConnect) return { kind: "skip" };
  const deadline = getWaitDeadline(doc);
  if (deadline === null || now < deadline) return { kind: "skip" };
  return { kind: "write", consultation: { expiredAt: formatWriteTime(now) } };
}

/** 종료를 시작함. 이후 모든 쓰기가 거절됨. REST 종료 전에 먼저 씀. 반복해도 안전함. */
export function planBeginClose(
  doc: ConsultationDoc | undefined,
  now: number,
): Plan {
  if (!doc) return reject("missing");
  if (doc.finishTime || doc.closingAt) return { kind: "skip" };
  // 취소된 요청도 종료로 정리함(REST에 열린 요청이 남지 않게).
  return { kind: "write", consultation: { closingAt: formatWriteTime(now) } };
}

/** REST로 종료가 확인되지 않았을 때(재조회로 아직 열려 있음) 종료 표시를 거둠. */
export function planAbortClose(doc: ConsultationDoc | undefined): Plan {
  if (!doc) return reject("missing");
  if (doc.finishTime || !doc.closingAt) return { kind: "skip" };
  return { kind: "write", consultation: { closingAt: null } };
}

/**
 * REST 종료가 끝난 뒤 종료 메시지와 `finishTime`을 한 번에 확정함. 이미 `finishTime`이 있으면
 * 종료 메시지를 또 붙이지 않음. `closingAt`이 막은 전송은 여기서만 예외.
 */
export function planFinishClose(
  doc: ConsultationDoc | undefined,
  input: { closeMessageId: string; now: number },
): Plan {
  if (!doc) return reject("missing");
  if (doc.finishTime) return { kind: "skip" };
  const stamp = formatWriteTime(input.now);
  const messages = doc.messages ?? [];
  const hasCloseMessage = messages.some(
    (m) => m.messageId === input.closeMessageId,
  );
  return {
    kind: "write",
    consultation: {
      // v2 광고주 종료와 같은 값(화면 판정은 finishTime을 먼저 봄).
      isConnect: true,
      finishTime: stamp,
      ...(hasCloseMessage
        ? {}
        : {
            messages: [
              ...messages,
              {
                auto: true,
                attachmentIdx: null,
                identifier: null,
                isUserMessage: false,
                body: "실시간 상담이 종료되었습니다.",
                fileName: null,
                created: stamp,
                messageId: input.closeMessageId,
              },
            ],
          }),
    },
    account: {
      currentCampaignIdx: null,
      newSenderUserIdx: null,
      alarmData: null,
      updated: stamp,
    },
  };
}

/**
 * 락을 얻거나 내 탭의 만료를 연장함. 다른 계정이든 같은 계정의 다른 탭이든 살아 있는 락이 있으면
 * 거절함(사용자 결정 2026-10-20: 같은 아이디의 동시 접속도 막음). 탭 목록이 없는 락(v2가 만든 것)은
 * 만료를 알 수 없어 소유자가 놓을 때까지 다른 계정에만 유효하고, 같은 계정은 통과함(창을 비정상
 * 종료한 v2 락이 영구히 막지 않도록). 거절 때는 `{kind:"reject", reason:"lock-lost"}`.
 */
export function planAcquireLock(
  account: AccountDoc | undefined,
  lock: Lock,
  sequence: number,
  now: number,
): Plan {
  const holder = account?.clientResponseUserIdx ?? null;
  const tabs = liveTabs(account ?? {}, now);
  const hasTabsField = account?.clientResponseTabs != null;
  if (holder && holder !== lock.owner) {
    const isAlive = hasTabsField ? Object.keys(tabs).length > 0 : true;
    if (isAlive) return reject("lock-lost");
  }
  if (
    holder === lock.owner &&
    Object.keys(tabs).some((id) => id !== lock.tabId)
  )
    return reject("lock-lost");
  const mine = holder === lock.owner ? tabs : {};
  return {
    kind: "write",
    account: {
      clientResponseUserIdx: lock.owner,
      clientResponseSequence: sequence,
      clientResponseAt: formatWriteTime(now),
      clientResponseTabs: { ...mine, [lock.tabId]: now + LOCK_TTL_MS },
      updated: formatWriteTime(now),
    },
  };
}

/** 내 탭만 락에서 뺌. 살아 있는 탭이 남으면 락을 유지하고, 소유자가 바뀌었으면 아무것도 쓰지 않음. */
export function planReleaseLock(
  account: AccountDoc | undefined,
  lock: Lock,
  now: number,
): Plan {
  if (!account || account.clientResponseUserIdx !== lock.owner)
    return { kind: "skip" };
  const rest = liveTabs(account, now);
  delete rest[lock.tabId];
  const stamp = formatWriteTime(now);
  return {
    kind: "write",
    account:
      Object.keys(rest).length > 0
        ? { clientResponseTabs: rest, clientResponseAt: stamp, updated: stamp }
        : {
            clientResponseUserIdx: null,
            clientResponseSequence: null,
            clientResponseTabs: {},
            updated: stamp,
          },
  };
}

export interface CreateRequestInput {
  threadUserIdx: number;
  /** 세션의 광고주 `userIdx`(v2 `senderUserIdx`). */
  userIdx: number;
  /** 알림에 쓰는 로그인 id. */
  userId: string;
  sequence: number;
  threadIdx: number;
  /** 캠페인 문의면 캠페인 카드 정보, 기타 문의면 null. */
  campaign: {
    campaignIdx: number;
    campaignCode: string;
    productName: string;
    mainImageUrl: string | null;
  } | null;
  /**
   * 첫 auto 메시지. 캠페인 문의의 캠페인 카드 JSON(운영 앱·v2 대화가 이 메시지로 카드를 그림).
   * 기타 문의는 null이며 "기타문의" 안내는 보내지 않음(사용자 결정 2026-10-19).
   */
  firstMessage: { id: string; body: string } | null;
  now: number;
}

/** 운영 앱 알림(`alarmData`). 재시도에서는 캠페인 정보 없이 `campaignIdx`만 담음. */
export function buildRequestAlarm(
  input: Pick<
    CreateRequestInput,
    "threadUserIdx" | "userIdx" | "userId" | "campaign"
  >,
  campaignIdx: number | null,
  stamp: string,
): Fields {
  return {
    id: input.userId,
    callType: "client",
    threadUserIdx: input.threadUserIdx,
    userIdx: input.userIdx,
    title: `${input.userId} 에서/ 상담을 요청하였습니다.`,
    body: input.campaign
      ? `캠페인명 : ${input.campaign.productName}/캠페인코드 : ${input.campaign.campaignCode}/요청시간 : ${stamp}`
      : null,
    icon: input.campaign?.mainImageUrl ?? null,
    campaignIdx,
  };
}

/**
 * 실시간 상담 요청 생성: 상담 문서 전체와 계정 문서 갱신. 같은 `sequence` 문서가 이미 있으면 다시 만들지
 * 않음(생성 재시도). 계정 문서가 없으면 v2와 같은 초기값으로 만듦.
 */
export function planCreateRequest(
  existing: ConsultationDoc | undefined,
  account: Fields | undefined,
  input: CreateRequestInput,
): { consultation: Fields; account: Fields; createAccount: boolean } | null {
  if (existing) return null;
  const stamp = formatWriteTime(input.now);
  const campaignIdx = input.campaign?.campaignIdx ?? null;
  const alarm = buildRequestAlarm(input, campaignIdx, stamp);
  return {
    createAccount: account === undefined,
    account: {
      currentCampaignIdx: campaignIdx,
      threadBoardType: 0,
      newSenderUserIdx: 1,
      senderUserServiceType: "광고주",
      alarmData: alarm,
      msgResponseDate: stamp,
      updated: stamp,
    },
    consultation: {
      boardType: false,
      threadIdx: input.threadIdx,
      senderUserServiceType: "광고주",
      sequence: input.sequence,
      senderThreadUserIdx: input.threadUserIdx,
      senderUserIdx: input.userIdx,
      isConnect: false,
      seqResponseDate: stamp,
      campaignIdx,
      finishTime: null,
      created: stamp,
      origin: "v3",
      waitDeadline: formatWriteTime(input.now + REALTIME_CONNECT_TIMEOUT_MS),
      messages: input.firstMessage
        ? [
            {
              auto: true,
              attachmentIdx: null,
              identifier: null,
              isUserMessage: false,
              body: input.firstMessage.body,
              fileName: null,
              created: stamp,
              messageId: input.firstMessage.id,
            },
          ]
        : [],
    },
  };
}

/**
 * 요청 실패(마감 경과·만료)한 v3 요청을 같은 문의로 다시 요청함. 마감을 새로 잡고 운영 앱이 알아차리도록
 * 알림을 다시 남김. 연결됐거나 끝난·취소된 요청은 거절함. 아직 마감 전이면 건너뜀.
 */
export function planRetryRequest(
  doc: ConsultationDoc | undefined,
  input: { alarm: Fields | null; now: number },
): Plan {
  if (!doc) return reject("missing");
  // 만료는 재시도 대상이라 거절 사유에서 뺌.
  const closed = getClosedReason({ ...doc, expiredAt: null });
  if (closed) return reject(closed);
  if (doc.isConnect) return reject("connected");
  const deadline = getWaitDeadline(doc);
  if (!doc.expiredAt && (deadline === null || input.now < deadline))
    return { kind: "skip" };
  const stamp = formatWriteTime(input.now);
  return {
    kind: "write",
    consultation: {
      expiredAt: null,
      seqResponseDate: stamp,
      waitDeadline: formatWriteTime(input.now + REALTIME_CONNECT_TIMEOUT_MS),
    },
    account: {
      threadBoardType: 0,
      newSenderUserIdx: 1,
      alarmData: input.alarm,
      msgResponseDate: stamp,
      updated: stamp,
    },
  };
}
