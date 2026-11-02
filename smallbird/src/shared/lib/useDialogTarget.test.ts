import { act, renderHook } from "@testing-library/react";

import { useDialogTarget } from "./useDialogTarget";

describe("useDialogTarget", () => {
  it("열면 대상과 함께 열리고, 닫아도 대상은 남는다", () => {
    const { result } = renderHook(() => useDialogTarget<string>());
    expect(result.current).toMatchObject({ target: null, isOpen: false });

    act(() => result.current.open("sub01"));
    expect(result.current).toMatchObject({ target: "sub01", isOpen: true });

    act(() => result.current.close());
    expect(result.current).toMatchObject({ target: "sub01", isOpen: false });
  });

  it("다시 열면 새 대상으로 바뀐다", () => {
    const { result } = renderHook(() => useDialogTarget<string>());
    act(() => result.current.open("sub01"));
    act(() => result.current.close());
    act(() => result.current.open("sub02"));
    expect(result.current).toMatchObject({ target: "sub02", isOpen: true });
  });
});
