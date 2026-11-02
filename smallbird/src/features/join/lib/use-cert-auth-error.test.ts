import { act, renderHook, waitFor } from "@testing-library/react";

import { useCertAuth } from "./use-cert-auth";

// The real HTTP client runs here so a genuine ApiError reaches the hook.
describe("useCertAuth server errors", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows the message from the failed response body", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ message: "expired" }), { status: 400 }),
        ),
    );
    const { result } = renderHook(() => useCertAuth(vi.fn()));

    act(() => {
      window.cert_result?.({ rec_cert: "REC", certNum: "NUM" });
    });

    await waitFor(() =>
      expect(result.current.result).toEqual({
        status: "fail",
        message: "expired",
      }),
    );
  });
});
