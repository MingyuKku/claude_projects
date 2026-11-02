import { act, renderHook } from "@testing-library/react";

import { memberApi } from "@/shared/api";

import { useIdDuplicateCheck } from "./use-id-duplicate-check";

import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  memberApi: { get: vi.fn(), post: vi.fn() },
}));

const post = vi.mocked(memberApi.post);

function setup() {
  const patchAccount = vi.fn();
  const hook = renderHook(() => useIdDuplicateCheck({ patchAccount }));
  return { ...hook, patchAccount };
}

describe("useIdDuplicateCheck", () => {
  beforeEach(() => {
    post.mockReset();
  });

  it("빈 값은 empty 오류를 낸다", async () => {
    const { result } = setup();
    await act(() => result.current.verifyId(""));
    expect(result.current.idFormatError).toBe("empty");
    expect(post).not.toHaveBeenCalled();
  });

  it("형식이 틀리면 idHint 오류를 내고 서버에 묻지 않는다", async () => {
    const { result } = setup();
    await act(() => result.current.verifyId("ab"));
    expect(result.current.idFormatError).toBe("idHint");
    expect(post).not.toHaveBeenCalled();
  });

  it("사용할 수 있는 아이디면 possible로 바꾼다", async () => {
    post.mockResolvedValue({ result: 0 });
    const { result, patchAccount } = setup();
    await act(() => result.current.verifyId("tester01"));
    expect(result.current.idFormatError).toBeNull();
    expect(patchAccount).toHaveBeenCalledWith({ idStatus: "possible" });
  });

  it("이미 있는 아이디면 wrong으로 바꾼다", async () => {
    post.mockResolvedValue({ result: 1 });
    const { result, patchAccount } = setup();
    await act(() => result.current.verifyId("tester01"));
    expect(patchAccount).toHaveBeenCalledWith({ idStatus: "wrong" });
  });

  it("요청이 실패하면 idCheckError를 내고, 지우면 사라진다", async () => {
    post.mockRejectedValue(new Error("network"));
    const { result } = setup();
    await act(() => result.current.verifyId("tester01"));
    expect(result.current.idFormatError).toBe("idCheckError");

    act(() => result.current.clearIdFormatError());
    expect(result.current.idFormatError).toBeNull();
  });
});
