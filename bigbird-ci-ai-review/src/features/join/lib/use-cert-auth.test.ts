import { act, renderHook, waitFor } from "@testing-library/react";

import { memberApi } from "@/shared/api";

import { useCertAuth } from "./use-cert-auth";

import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  memberApi: { get: vi.fn(), post: vi.fn() },
}));

const get = vi.mocked(memberApi.get);

function callCertResult() {
  window.cert_result?.({ rec_cert: "REC", certNum: "NUM" });
}

describe("useCertAuth", () => {
  beforeEach(() => get.mockReset());

  it("registers the KMC callback and removes it on unmount", () => {
    const { unmount } = renderHook(() => useCertAuth(vi.fn()));
    expect(window.cert_result).toBeTypeOf("function");
    unmount();
    expect(window.cert_result).toBeUndefined();
  });

  it("decrypts the popup result and reports success", async () => {
    get.mockResolvedValue({
      result: "success",
      certIdx: 9,
      name: "홍길동",
      phoneNumber: "01012345678",
    });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useCertAuth(onSuccess));

    act(callCertResult);

    await waitFor(() => expect(result.current.result.status).toBe("success"));
    expect(get).toHaveBeenCalledWith(
      expect.stringContaining("/cert/decrypte/"),
      { params: { rec_cert: "REC", certNum: "NUM" } },
    );
    expect(onSuccess).toHaveBeenCalledWith({
      certIdx: 9,
      name: "홍길동",
      phoneNumber: "01012345678",
    });
  });

  it("flags an already registered number", async () => {
    get.mockResolvedValue({ result: "exists", message: "dup" });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useCertAuth(onSuccess));

    act(callCertResult);

    await waitFor(() =>
      expect(result.current.result).toEqual({
        status: "exists",
        message: "dup",
      }),
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("reports a failed verification with the server message", async () => {
    get.mockResolvedValue({ result: false, message: "nope" });
    const { result } = renderHook(() => useCertAuth(vi.fn()));

    act(callCertResult);

    await waitFor(() =>
      expect(result.current.result).toEqual({
        status: "fail",
        message: "nope",
      }),
    );
  });

  it("flags a blocked popup when window.open returns null", async () => {
    get.mockResolvedValue({ trCert: "c", trUrl: "u", trAdd: "Y" });
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    const { result } = renderHook(() => useCertAuth(vi.fn()));

    await act(() => result.current.open());

    expect(result.current.isPopupBlocked).toBe(true);
    openSpy.mockRestore();
  });
});
