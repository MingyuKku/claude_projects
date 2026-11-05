import useSWRImmutable from "swr/immutable";

import { fetchKmcRequestToken } from "@/shared/lib";

/**
 * 본인인증 요청값은 KMC에 한 번 제출하면 끝나는 일회성 값이라 재검증·재시도하지 않음.
 */
export function useCertInit() {
  const { data, error } = useSWRImmutable(
    ["join", "cert", "init"],
    fetchKmcRequestToken,
    { shouldRetryOnError: false },
  );
  return { cert: data, isError: Boolean(error) };
}
