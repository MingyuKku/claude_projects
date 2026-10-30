import { renderHook } from "@testing-library/react";

import { useOnPageRestore } from "./useOnPageRestore";

function firePageShow(persisted: boolean) {
  const event = new Event("pageshow") as PageTransitionEvent;
  Object.defineProperty(event, "persisted", { value: persisted });
  window.dispatchEvent(event);
}

describe("useOnPageRestore", () => {
  it("캐시에서 복원된 pageshow에서만 콜백을 부른다", () => {
    const callback = vi.fn();
    renderHook(() => useOnPageRestore(callback));

    firePageShow(false);
    expect(callback).not.toHaveBeenCalled();

    firePageShow(true);
    expect(callback).toHaveBeenCalledOnce();
  });

  it("언마운트하면 더 부르지 않는다", () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useOnPageRestore(callback));
    unmount();

    firePageShow(true);
    expect(callback).not.toHaveBeenCalled();
  });
});
