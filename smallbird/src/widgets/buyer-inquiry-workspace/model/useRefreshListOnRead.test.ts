import { renderHook } from "@testing-library/react";

import { useRefreshListOnRead } from "./useRefreshListOnRead";

describe("useRefreshListOnRead", () => {
  it("대화를 받기 전에는 부르지 않고, 받은 뒤 한 번 부른다", () => {
    const onRead = vi.fn();
    const { rerender } = renderHook(
      ({ isLoaded }) => useRefreshListOnRead("qna-1", true, isLoaded, onRead),
      { initialProps: { isLoaded: false } },
    );
    expect(onRead).not.toHaveBeenCalled();
    rerender({ isLoaded: true });
    expect(onRead).toHaveBeenCalledOnce();
    // 다시 그려도 같은 문의는 되풀이하지 않음(서버가 읽음으로 못 바꿔도 요청이 반복되면 안 됨)
    rerender({ isLoaded: true });
    expect(onRead).toHaveBeenCalledOnce();
  });

  it("이미 읽은 문의는 부르지 않는다", () => {
    const onRead = vi.fn();
    renderHook(() => useRefreshListOnRead("qna-1", false, true, onRead));
    expect(onRead).not.toHaveBeenCalled();
  });

  it("다른 안 읽은 문의를 열면 다시 한 번 부른다", () => {
    const onRead = vi.fn();
    const { rerender } = renderHook(
      ({ inquiryKey }) => useRefreshListOnRead(inquiryKey, true, true, onRead),
      { initialProps: { inquiryKey: "purchaser-1" } },
    );
    expect(onRead).toHaveBeenCalledOnce();
    rerender({ inquiryKey: "purchaser-2" });
    expect(onRead).toHaveBeenCalledTimes(2);
  });

  it("읽힌 뒤 같은 문의가 다시 안 읽음이 되면 다시 부른다", () => {
    const onRead = vi.fn();
    const { rerender } = renderHook(
      ({ inquiryKey, hasUnread }) =>
        useRefreshListOnRead(inquiryKey, hasUnread, true, onRead),
      { initialProps: { inquiryKey: "purchaser-1", hasUnread: true } },
    );
    expect(onRead).toHaveBeenCalledOnce();
    // 갱신으로 읽힘 → 다른 읽은 문의를 열었다가 → 처음 문의에 새 메시지가 와 다시 안 읽음
    rerender({ inquiryKey: "purchaser-1", hasUnread: false });
    rerender({ inquiryKey: "purchaser-2", hasUnread: false });
    rerender({ inquiryKey: "purchaser-1", hasUnread: true });
    expect(onRead).toHaveBeenCalledTimes(2);
  });

  it("안 읽음이 그대로면 목록이 다시 그려져도 되풀이하지 않는다", () => {
    const onRead = vi.fn();
    const { rerender } = renderHook(
      ({ isLoaded }) => useRefreshListOnRead("qna-1", true, isLoaded, onRead),
      { initialProps: { isLoaded: true } },
    );
    rerender({ isLoaded: false });
    rerender({ isLoaded: true });
    expect(onRead).toHaveBeenCalledOnce();
  });

  it("목록 갱신 함수가 없어도 오류 없이 지나간다", () => {
    expect(() =>
      renderHook(() => useRefreshListOnRead("qna-1", true, true)),
    ).not.toThrow();
  });
});
