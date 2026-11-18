import { renderHook } from "@testing-library/react";
import { act } from "react";
import { MemoryRouter, useLocation } from "react-router";

import { useListParams } from "./use-list-params";

import type { ReactNode } from "react";

type Params = ReturnType<typeof useListParams>;

const DETAIL_URL = "/?panel=charge-detail&id=charge-1&page=2&size=20";

function setup(url = DETAIL_URL) {
  function wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>;
  }

  return renderHook(
    () => ({
      params: useListParams([], [10, 20, 30]),
      location: useLocation(),
    }),
    { wrapper },
  );
}

function readSearch(result: ReturnType<typeof setup>["result"]) {
  return new URLSearchParams(result.current.location.search);
}

describe("useListParams: 목록 조건이 바뀌어도 열어 둔 상세를 닫지 않는다", () => {
  it.each([
    ["필터를 바꿀 때", (params: Params) => params.setFilters({})],
    ["검색어를 바꿀 때", (params: Params) => params.setKeyword("여름")],
    ["새로고침(필터 초기화)을 누를 때", (params: Params) => params.reset()],
    ["쪽을 옮길 때", (params: Params) => params.setPage(3)],
    ["N개 보기를 바꿀 때", (params: Params) => params.setPageSize(30)],
  ])("%s", (_, change) => {
    const { result } = setup();

    act(() => change(result.current.params));

    const search = readSearch(result);
    expect(search.get("panel")).toBe("charge-detail");
    expect(search.get("id")).toBe("charge-1");
  });

  it("쪽 이동 링크도 상세를 그대로 둔 주소다", () => {
    const { result } = setup();

    expect(result.current.params.buildPageHref(3)).toBe(
      "?panel=charge-detail&id=charge-1&page=3&size=20",
    );
  });

  it("범위를 벗어난 쪽을 마지막 쪽으로 당길 때는 상세를 그대로 둔다", () => {
    const { result } = setup();

    act(() => result.current.params.clampPage(2));

    const search = readSearch(result);
    expect(search.get("panel")).toBe("charge-detail");
    expect(search.get("id")).toBe("charge-1");
  });

  it("MO 필터 모달의 적용하기는 모달(`panel=filter`)만 닫는다", () => {
    const { result } = setup("/?panel=filter&size=20");

    act(() => result.current.params.applyFiltersAndClosePanel({}));

    expect(readSearch(result).has("panel")).toBe(false);
  });
});
