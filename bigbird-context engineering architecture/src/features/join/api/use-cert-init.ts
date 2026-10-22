import useSWRImmutable from "swr/immutable";

import { certInit } from "./join-api";

/**
 * 본인인증 요청값은 KMC에 한 번 제출하면 끝나는 일회성 값이라 재검증·재시도하지 않음.
 */
export function useCertInit(service: string | number) {
  const { data, error } = useSWRImmutable(
    ["join", "cert", "init", service],
    () => certInit(service),
    { shouldRetryOnError: false },
  );
  return { cert: data, isError: Boolean(error) };
}
