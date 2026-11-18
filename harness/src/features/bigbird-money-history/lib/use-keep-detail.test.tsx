import { renderHook } from "@testing-library/react";

import { useKeepDetail } from "./use-keep-detail";

interface Props {
  id: string | null;
  found: { id: string; name: string } | null;
}

const RECORD = { id: "a", name: "원본" };

function setup(initialProps: Props) {
  return renderHook(({ id, found }: Props) => useKeepDetail(id, found), {
    initialProps,
  });
}

describe("useKeepDetail", () => {
  it("목록에서 찾았으면 그대로 돌려준다", () => {
    const { result } = setup({ id: "a", found: RECORD });
    expect(result.current).toBe(RECORD);
  });

  it("열어 둔 뒤 목록에서 사라져도 마지막으로 찾은 내용을 돌려준다", () => {
    const { result, rerender } = setup({ id: "a", found: RECORD });
    rerender({ id: "a", found: null });
    expect(result.current).toBe(RECORD);
  });

  it("목록에서 다시 찾으면 새 내용으로 바뀐다", () => {
    const { result, rerender } = setup({ id: "a", found: RECORD });
    const updated = { id: "a", name: "갱신" };
    rerender({ id: "a", found: updated });
    rerender({ id: "a", found: null });
    expect(result.current).toBe(updated);
  });

  it("처음부터 목록에 없으면(주소로 바로 열기) null이다", () => {
    const { result } = setup({ id: "a", found: null });
    expect(result.current).toBeNull();
  });

  it("id가 없으면 null이다", () => {
    const { result } = setup({ id: null, found: null });
    expect(result.current).toBeNull();
  });

  it("다른 대상으로 바꾸면 이전 대상의 내용은 쓰지 않는다", () => {
    const { result, rerender } = setup({ id: "a", found: RECORD });
    rerender({ id: "b", found: null });
    expect(result.current).toBeNull();
  });
});
