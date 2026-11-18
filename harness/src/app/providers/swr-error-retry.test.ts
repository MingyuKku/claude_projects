import { ApiError } from "@/shared/api";

import { onErrorRetry } from "./swr-error-retry";

import type { Revalidator, RevalidatorOptions } from "swr";
import type { PublicConfiguration } from "swr/_internal";

const config = { errorRetryInterval: 5000 } as Readonly<
  PublicConfiguration<unknown, unknown>
>;

function run(error: unknown, retryCount: number) {
  const revalidate = vi.fn<Revalidator>();
  const options: Required<RevalidatorOptions> = { retryCount, dedupe: true };
  onErrorRetry(error, "key", config as never, revalidate, options);
  return revalidate;
}

describe("SWR 에러 재시도", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([400, 401, 404, 500, 503])(
    "서버가 %i로 응답하면 재시도하지 않는다",
    (status) => {
      const revalidate = run(new ApiError(status, undefined), 0);
      vi.runAllTimers();
      expect(revalidate).not.toHaveBeenCalled();
    },
  );

  it("네트워크 오류는 재시도한다", () => {
    const revalidate = run(new TypeError("Failed to fetch"), 0);
    vi.runAllTimers();
    expect(revalidate).toHaveBeenCalledWith({ retryCount: 1 });
  });

  it("네트워크 오류도 상한을 넘으면 재시도하지 않는다", () => {
    const revalidate = run(new TypeError("Failed to fetch"), 3);
    vi.runAllTimers();
    expect(revalidate).not.toHaveBeenCalled();
  });
});
