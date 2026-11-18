import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { applyNotificationConsentChange } from "../lib/transform-notification-consent";
import {
  fetchNotificationConsent,
  updateNotificationConsent,
} from "./consent-api";

import type {
  NotificationConsentChange,
  NotificationConsentViewModel,
} from "../model/types";

const NOTIFICATION_CONSENT_KEY = ["mypage", "notification-consent"] as const;

/** 알림 수신 동의 상태. */
export function useNotificationConsent() {
  const { data, error, isLoading, mutate } = useSWR(
    NOTIFICATION_CONSENT_KEY,
    fetchNotificationConsent,
  );
  return { consent: data, isLoading, isError: Boolean(error), mutate };
}

/** 스위치를 바꾸는 즉시 화면에 반영하고, 실패하면 이전 값으로 되돌림. 실패는 `trigger`가 던짐. */
export function useUpdateNotificationConsent() {
  const { trigger } = useSWRMutation(
    NOTIFICATION_CONSENT_KEY,
    (_key, { arg }: { arg: NotificationConsentChange }) =>
      updateNotificationConsent(arg),
  );

  /** `current`는 화면에 그린 현재 상태(스위치는 조회가 끝난 뒤에만 그려짐). */
  function updateConsent(
    current: NotificationConsentViewModel,
    change: NotificationConsentChange,
  ) {
    return trigger(change, {
      optimisticData: applyNotificationConsentChange(current, change),
      rollbackOnError: true,
      populateCache: true,
      revalidate: false,
    });
  }

  return { updateConsent };
}
