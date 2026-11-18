import { getPageItems } from "./get-page-items";

function summarize(current: number, total: number) {
  return getPageItems(current, total).map((item) =>
    item.type === "page" ? String(item.page) : "…",
  );
}

describe("getPageItems", () => {
  it("쪽이 6개 이하면 줄임표 없이 모두 보인다", () => {
    expect(summarize(1, 1)).toEqual(["1"]);
    expect(summarize(3, 6)).toEqual(["1", "2", "3", "4", "5", "6"]);
  });

  it("처음에는 시안처럼 1~6과 뒤쪽 줄임표를 보인다", () => {
    expect(summarize(1, 12)).toEqual(["1", "2", "3", "4", "5", "6", "…"]);
  });

  it("현재 쪽이 창 안에 들어오도록 밀리고 앞뒤에 줄임표가 붙는다", () => {
    expect(summarize(6, 12)).toEqual(["…", "4", "5", "6", "7", "8", "9", "…"]);
  });

  it("끝에서는 앞쪽 줄임표만 붙고 마지막 6개를 보인다", () => {
    expect(summarize(12, 12)).toEqual(["…", "7", "8", "9", "10", "11", "12"]);
  });

  it("쪽이 없으면 비어 있다", () => {
    expect(getPageItems(1, 0)).toEqual([]);
  });
});
