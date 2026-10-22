import { act, renderHook } from "@testing-library/react";

import { useExpandedQueryDialog } from "./useExpandedQueryDialog";

function setup(isDesktop = false) {
  const onCloseFocus = vi.fn();
  const hook = renderHook(
    (props: { isDesktop: boolean }) =>
      useExpandedQueryDialog({ isDesktop: props.isDesktop, onCloseFocus }),
    { initialProps: { isDesktop } },
  );
  return { ...hook, onCloseFocus };
}

describe("useExpandedQueryDialog", () => {
  it("열면 history 항목을 쌓고 열림 상태가 된다", () => {
    const length = window.history.length;
    const { result } = setup();
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
    expect(window.history.length).toBe(length + 1);
    expect(window.history.state).toMatchObject({ searchExpanded: true });
  });

  it("사용자 동작으로 닫으면 동기로 포커스 콜백을 부르고 쌓은 항목을 정리한다", () => {
    const back = vi.spyOn(window.history, "back");
    const { result, onCloseFocus } = setup();
    act(() => result.current.open());
    act(() => result.current.closeByUser());
    expect(result.current.isOpen).toBe(false);
    expect(onCloseFocus).toHaveBeenCalledTimes(1);
    expect(back).toHaveBeenCalledTimes(1);
    back.mockRestore();
  });

  it("뒤로가기(popstate)로 닫힌다", () => {
    const { result } = setup();
    act(() => result.current.open());
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("이동하면서 닫을 때 쌓은 항목이 있으면 replace를 요청한다", () => {
    const { result } = setup();
    act(() => result.current.open());
    let shouldReplace = false;
    act(() => {
      shouldReplace = result.current.closeForNavigation().shouldReplace;
    });
    expect(shouldReplace).toBe(true);
    expect(result.current.isOpen).toBe(false);
    act(() => {
      shouldReplace = result.current.closeForNavigation().shouldReplace;
    });
    expect(shouldReplace).toBe(false);
  });

  it("PC 폭이 되면 열려 있어도 열림 상태가 아니다", () => {
    const { result, rerender } = setup();
    act(() => result.current.open());
    rerender({ isDesktop: true });
    expect(result.current.isOpen).toBe(false);
  });
});
