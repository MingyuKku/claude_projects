// 이 앱에서 캠페인을 바꾼 기록. 목록 캐시(조건·쪽별)가 다시 보일 때 마지막으로 맞춘 뒤의 변경만 반영하려고 순번으로 남김.
// campaignIdx가 있으면 그 캠페인의 내용만 바뀐 것(순서·탭·건수 그대로), null이면 목록 구성이 바뀐 것(생성·삭제·상태 변경).
interface CampaignChange {
  seq: number;
  campaignIdx: number | null;
}

let lastSeq = 0;
const changes: CampaignChange[] = [];
const syncedSeqs = new Map<string, number>();

/** 단계 저장처럼 목록에서의 위치·탭은 그대로이고 카드 내용만 바뀌는 요청이 성공하면 부름. */
export function markCampaignContentChanged(campaignIdx: number) {
  lastSeq += 1;
  changes.push({ seq: lastSeq, campaignIdx });
}

/** 생성·삭제·상태 변경처럼 목록의 건수나 탭 구성이 바뀌는 요청이 성공하면 부름. */
export function markCampaignListChanged() {
  lastSeq += 1;
  changes.push({ seq: lastSeq, campaignIdx: null });
}

export interface PendingCampaignChanges {
  /** 목록 구성이 바뀌어 쪽 경계가 밀렸을 수 있음(읽어 둔 쪽을 모두 다시 읽어야 함). */
  isStructural: boolean;
  /** 내용만 바뀐 캠페인. */
  campaignIdxs: ReadonlySet<number>;
}

/**
 * 목록 캐시(`listKey`)가 마지막으로 맞춘 뒤의 변경을 꺼내고, 지금까지 맞춘 것으로 적음. 처음 보는 목록은 방금 읽은 값이
 * 최신이라 바뀐 것이 없음(null).
 */
export function takePendingCampaignChanges(
  listKey: string,
): PendingCampaignChanges | null {
  const syncedSeq = syncedSeqs.get(listKey);
  syncedSeqs.set(listKey, lastSeq);
  if (syncedSeq === undefined || syncedSeq === lastSeq) return null;
  const pending = changes.filter((change) => change.seq > syncedSeq);
  const campaignIdxs = new Set<number>();
  for (const change of pending) {
    if (change.campaignIdx !== null) campaignIdxs.add(change.campaignIdx);
  }
  return {
    isStructural: pending.some((change) => change.campaignIdx === null),
    campaignIdxs,
  };
}

/** 테스트 사이에 앞 테스트의 변경 기록이 남지 않게 비움. */
export function resetCampaignListChanges() {
  lastSeq = 0;
  changes.length = 0;
  syncedSeqs.clear();
}
