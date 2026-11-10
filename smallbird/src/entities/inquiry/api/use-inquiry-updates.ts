import { tryit } from "radash";
import { useEffect, useRef } from "react";

import { ApiError, isApiError, serverApiV3 } from "@/shared/api";

import { inquiryHasUpdatesSchema } from "../model/schema";

/** 변경 확인 주기. 백엔드 안내는 5~10초. */
const POLL_INTERVAL_MS = 10_000;
/** 첫 `since`를 목록을 받은 시각보다 앞당기는 폭. 이 PC 시계와 서버 시계의 어긋남을 덮음(겹쳐 한 번 더 받는 쪽이 놓치는 쪽보다 나음). */
const FIRST_SINCE_BUFFER_MS = 30_000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
/** 서버가 `since`로 받는 초 단위 형식. */
const SINCE_FORMAT = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

/** 서버가 쓰는 한국 시각 `yyyy-MM-dd HH:mm:ss`(PC의 시간대와 무관). */
export function formatKstDateTime(timestamp: number) {
  return new Date(timestamp + KST_OFFSET_MS)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
}

export interface InquiryUpdateQuery {
  /** 인플루언서 문의 메뉴면 전용 엔드포인트(`/influencer-inquiry/has-updates`)를 씀. */
  isInfluencerMenu: boolean;
  /** 목록에 건 필터와 같은 서버 값. 검색어·등록일은 폴링 대상이 아님(바뀌면 목록을 다시 받을 때 반영됨). */
  status: string;
  sourceType: string;
  campaignIdx?: number;
  influencerThreadUserIdx?: number;
}

/** `since` 이후 목록에 바뀐 게 있는지만 확인함. 실제 목록은 기존 목록 API가 받음. */
export async function fetchInquiryHasUpdates(
  query: InquiryUpdateQuery,
  since: string,
) {
  const response = await serverApiV3.get(
    query.isInfluencerMenu
      ? "/help/influencer-inquiry/has-updates"
      : "/help/inquiry/has-updates",
    {
      params: {
        since,
        status: query.status,
        sourceType: query.sourceType,
        ...(query.campaignIdx === undefined
          ? {}
          : { campaignIdx: query.campaignIdx }),
        ...(query.influencerThreadUserIdx === undefined
          ? {}
          : { influencerThreadUserIdx: query.influencerThreadUserIdx }),
      },
    },
  );
  const parsed = inquiryHasUpdatesSchema.parse(response);
  if (!parsed.result) throw new ApiError(200, parsed);
  return parsed;
}

/**
 * 목록이 떠 있는 동안 10초마다 변경 여부를 확인하고, 바뀌었을 때만 `onUpdated`(목록 다시 받기)를 부름.
 * - 첫 `since`는 목록을 받은 KST 시각 − 30초이고, 이후에는 응답의 `checkedAt`만 다음 `since`로 씀(초 단위 형식이 아니면
 *   PC 시각 − 30초로 대신함).
 * - 탭이 가려지면 멈추고 다시 보이면 바로 한 번 확인함.
 * - `listKey`(탭·필터·검색)가 바뀌거나 목록이 아직 없으면 멈췄다가 목록이 오면 `since`를 새로 잡음. 받아 둔 목록을 다시
 *   받는 동안에는 멈추지 않고, 겹친 확인은 `isChecking`과 목록 다시 받기의 합침이 막음.
 * - 실패는 조용히 다음 주기에 다시 시도함. 권한이 없으면(403, 서브 계정) 그 뒤로는 확인하지 않음.
 */
export function useInquiryUpdatePolling(
  listKey: string,
  isLoaded: boolean,
  query: InquiryUpdateQuery,
  onUpdated: () => void,
) {
  const queryRef = useRef(query);
  const onUpdatedRef = useRef(onUpdated);
  useEffect(() => {
    queryRef.current = query;
    onUpdatedRef.current = onUpdated;
  });

  useEffect(() => {
    if (!isLoaded) return;
    let since = formatKstDateTime(Date.now() - FIRST_SINCE_BUFFER_MS);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let isStopped = false;
    let isChecking = false;

    function scheduleNextCheck() {
      clearTimeout(timer);
      if (!isStopped && !document.hidden)
        timer = setTimeout(() => void check(), POLL_INTERVAL_MS);
    }

    async function check() {
      if (isChecking || isStopped) return;
      isChecking = true;
      const [error, result] = await tryit(fetchInquiryHasUpdates)(
        queryRef.current,
        since,
      );
      isChecking = false;
      if (isStopped) return;
      if (error) {
        if (isApiError(error) && error.status === 403) isStopped = true;
      } else {
        // checkedAt이 초 단위가 아니면(분 단위 등) 그대로 since로 쓸 때 서버가 거부해 확인이 계속 실패하므로 PC 시각 − 30초로 대신함.
        since = SINCE_FORMAT.test(result.checkedAt)
          ? result.checkedAt
          : formatKstDateTime(Date.now() - FIRST_SINCE_BUFFER_MS);
        if (result.hasUpdates) onUpdatedRef.current();
      }
      scheduleNextCheck();
    }

    function handleVisibilityChange() {
      clearTimeout(timer);
      if (!document.hidden) void check();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    scheduleNextCheck();
    return () => {
      isStopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [listKey, isLoaded]);
}
