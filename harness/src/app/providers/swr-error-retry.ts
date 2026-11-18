import { isApiError } from "@/shared/api";

import type { SWRConfiguration } from "swr";

// 응답 없는 네트워크 오류의 재시도 상한
const MAX_NETWORK_RETRY_COUNT = 3;
// 지수 백오프 지수의 상한 (2^8 배수)
const MAX_BACKOFF_EXPONENT = 8;

/**
 * 서버가 응답한 에러(4xx·5xx)는 다시 불러도 같은 결과라 재시도하지 않음. SWR 기본값은 횟수 제한 없이
 * 재시도해서 서버 오류가 나는 동안 같은 요청이 계속 쌓임. 응답 자체가 없는 네트워크 오류만 제한적으로 재시도함.
 */
export const onErrorRetry: NonNullable<SWRConfiguration["onErrorRetry"]> = (
  error,
  _key,
  config,
  revalidate,
  { retryCount },
) => {
  if (isApiError(error)) return;
  if (retryCount >= MAX_NETWORK_RETRY_COUNT) return;

  const backoff = 1 << Math.min(retryCount, MAX_BACKOFF_EXPONENT);
  const timeout =
    Math.floor((Math.random() + 0.5) * backoff) * config.errorRetryInterval;
  setTimeout(() => void revalidate({ retryCount: retryCount + 1 }), timeout);
};
