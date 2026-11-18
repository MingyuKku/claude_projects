// 실시간 상담에서 프론트가 아직 직접 쓰는 것만 남김(백엔드 흐름도 프론트팀 가이드 2026-11-03): 계정 문서의 응대 락과
// 운영 알림 내용. 상담 문서(sequence)는 서버가 쓰므로 여기에 없음. Firestore를 모르는 순수 함수.

/** 락 탭이 갱신 없이 살아 있다고 보는 시간. 갱신 간격은 이 값의 1/3. */
export const LOCK_TTL_MS = 45_000;
export const LOCK_REFRESH_MS = 15_000;

export type Fields = Record<string, unknown>;

/** 실시간 상담을 요청하면 서버가 상담 문서에 남기는 auto 안내. 상담 문서 하나에 쌓인 상담을 나누는 데 씀. */
export const REALTIME_REQUEST_MESSAGE = "실시간 상담을 요청했습니다.";

/** 실시간 상담이 끝날 때 대화에 남는 안내. 서버·운영 앱·v2가 같은 문구를 보내므로 화면이 알아보는 데 씀. */
export const REALTIME_CLOSED_MESSAGE = "실시간 상담이 종료되었습니다.";

/**
 * 서버가 실시간 상담을 끝낼 때 남기는 auto 안내. 대화에서 구분선으로 보임. 서버 문구가 "상담이 종료되었습니다."로 바뀔 수
 * 있어 둘 다 인정하고, 10분 무응답 자동 종료 문구도 같은 구분선으로 보임(사용자 결정 2026-11-04).
 */
export const REALTIME_END_NOTICES: readonly string[] = [
  REALTIME_CLOSED_MESSAGE,
  "상담이 종료되었습니다.",
  "추가 문의가 없으셔서 실시간 상담이 자동종료되었습니다.",
];

/** 응대 락의 탭 하나(상담 건별 락, 사용자 결정 2026-11-03). */
export interface LockTab {
  /** `"{userIdx}_{accountIdx}"` */
  owner: string;
  /** 이 탭이 보고 있는 상담(`sequence`). 락은 이 값별로 판단함. */
  sequence: number;
  /** 만료 시각(ms). 갱신이 끊기면 이 시각 뒤에 풀린 것으로 봄. */
  expiresAt: number;
}

/**
 * 계정 문서(`threadUserIdx/{id}`)의 락 필드. `clientResponseTabs`는 탭 id → 탭 정보(예전 v3는 만료 시각 숫자만 둠).
 * `clientResponseUserIdx`·`clientResponseSequence`는 마지막으로 락을 얻은 v3 탭이거나, 탭 목록에 없는 소유자면 v2 락.
 */
export interface AccountDoc {
  clientResponseUserIdx?: string | null;
  clientResponseSequence?: number | null;
  clientResponseTabs?: Record<string, LockTab | number> | null;
}

export interface Lock {
  /** `"{userIdx}_{accountIdx}"` (v2와 같은 형식). */
  owner: string;
  tabId: string;
}

export type Plan =
  | { kind: "write"; account: Fields }
  /** 쓸 것이 없음. 성공으로 다룸. */
  | { kind: "skip" }
  | { kind: "reject"; reason: "lock-lost" };

const pad = (value: number) => String(value).padStart(2, "0");

/** 다른 앱이 읽는 `YYYY-MM-DD HH:mm:ss`(로컬 시각, v2의 moment 형식과 같음). */
export function formatWriteTime(time: number): string {
  const d = new Date(time);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** 살아 있는 탭만, 예전 숫자 형식은 계정의 소유자·상담으로 채워 같은 모양으로 돌려줌. */
function liveTabs(account: AccountDoc, now: number): Record<string, LockTab> {
  const entries = Object.entries(account.clientResponseTabs ?? {}).flatMap(
    ([tabId, value]): [string, LockTab][] => {
      const tab =
        typeof value === "number"
          ? {
              owner: account.clientResponseUserIdx ?? "",
              sequence: account.clientResponseSequence ?? -1,
              expiresAt: value,
            }
          : value;
      return tab.expiresAt > now ? [[tabId, tab]] : [];
    },
  );
  return Object.fromEntries(entries);
}

/**
 * v2가 잡은 락: 소유자는 있는데 v3 탭 목록에 그 소유자의 탭이 없음. v2는 만료를 쓰지 않아 소유자가 놓을 때까지 유효함.
 * v2 락은 v2가 쓴 상담 번호로만 막고, 번호가 없으면 모든 상담을 막음.
 */
function v2Lock(
  account: AccountDoc | undefined,
  tabs: Record<string, LockTab>,
) {
  const holder = account?.clientResponseUserIdx;
  if (!holder) return null;
  if (Object.values(tabs).some((tab) => tab.owner === holder)) return null;
  // 예전 v3(숫자 형식) 탭이 모두 만료돼 남은 소유자는 v2 락이 아님.
  if (account.clientResponseTabs != null) return null;
  return { owner: holder, sequence: account.clientResponseSequence ?? null };
}

/**
 * 상담 건(`sequence`)별로 락을 얻거나 내 탭의 만료를 연장함(사용자 결정 2026-11-03, 회사 계정 전체 단위 락을 대체).
 * 같은 상담에 살아 있는 다른 탭이 있으면 같은 계정이든 다른 상담원이든 거절함(2026-10-20 같은 아이디 동시 접속 차단 유지).
 * 다른 상담의 탭은 막지 않음. v2 락은 다른 계정에만 유효하고 같은 계정은 통과함(비정상 종료한 v2 락이 영구히 막지 않도록).
 * 다른 상담의 탭 정보는 그대로 두고 내 탭만 고침. 거절 때는 `{kind:"reject", reason:"lock-lost"}`.
 */
export function planAcquireLock(
  account: AccountDoc | undefined,
  lock: Lock,
  sequence: number,
  now: number,
): Plan {
  const tabs = liveTabs(account ?? {}, now);
  const legacy = v2Lock(account, tabs);
  if (
    legacy &&
    legacy.owner !== lock.owner &&
    (legacy.sequence === null || legacy.sequence === sequence)
  )
    return { kind: "reject", reason: "lock-lost" };
  const isTaken = Object.entries(tabs).some(
    ([tabId, tab]) => tab.sequence === sequence && tabId !== lock.tabId,
  );
  if (isTaken) return { kind: "reject", reason: "lock-lost" };
  return {
    kind: "write",
    account: {
      // 다른 상담의 v2 락이 남아 있으면 그 소유자 표시는 지우지 않음(v2 화면이 계속 막히도록).
      ...(legacy
        ? {}
        : {
            clientResponseUserIdx: lock.owner,
            clientResponseSequence: sequence,
          }),
      clientResponseAt: formatWriteTime(now),
      clientResponseTabs: {
        ...tabs,
        [lock.tabId]: {
          owner: lock.owner,
          sequence,
          expiresAt: now + LOCK_TTL_MS,
        },
      },
    },
  };
}

/**
 * 내 탭만 락에서 뺌. 다른 탭(같은 상담·다른 상담)은 그대로 둠. 남은 탭이 있으면 소유자 표시를 그중 하나로 옮기고,
 * 없으면 비움. v2 락이 남아 있거나 내 탭이 이미 없으면(늦은 해제) 아무것도 쓰지 않음.
 */
export function planReleaseLock(
  account: AccountDoc | undefined,
  lock: Lock,
  now: number,
): Plan {
  if (!account) return { kind: "skip" };
  const tabs = liveTabs(account, now);
  if (!(lock.tabId in tabs) || v2Lock(account, tabs)) return { kind: "skip" };
  const rest = { ...tabs };
  delete rest[lock.tabId];
  const next = Object.values(rest).at(-1);
  return {
    kind: "write",
    account: next
      ? {
          clientResponseUserIdx: next.owner,
          clientResponseSequence: next.sequence,
          clientResponseAt: formatWriteTime(now),
          clientResponseTabs: rest,
        }
      : {
          clientResponseUserIdx: null,
          clientResponseSequence: null,
          clientResponseTabs: {},
        },
  };
}

/** 운영 앱 알림(`alarmData`)에 담는 요청 정보. */
export interface RequestAlarmInput {
  threadUserIdx: number;
  /** 세션의 광고주 `userIdx`(v2 `senderUserIdx`). */
  userIdx: number;
  /** 알림에 쓰는 로그인 id. */
  userId: string;
  /** 서버가 아직 주지 않으면 null(운영 앱은 threadIdx로도 대화를 엶). */
  sequence: number | null;
  threadIdx: number | null;
  /** 캠페인 문의면 캠페인 정보, 기타 문의는 null. */
  campaign: {
    campaignIdx: number;
    campaignCode: string;
    productName: string;
    mainImageUrl: string | null;
  } | null;
}

/**
 * 운영 앱 알림(`alarmData`).
 * `origin`·`threadIdx`·`sequence`는 운영 앱이 v3 알림을 골라 해당 대화를 바로 열 때 씀(v2 알림에는 없음).
 */
export function buildRequestAlarm(
  input: RequestAlarmInput,
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
    origin: "v3",
    threadIdx: input.threadIdx,
    sequence: input.sequence,
  };
}
