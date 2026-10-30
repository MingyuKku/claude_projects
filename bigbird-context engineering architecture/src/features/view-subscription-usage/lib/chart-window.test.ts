import { describe, expect, it } from "vitest";

import {
  canGoNext,
  canGoPrev,
  getInitialStart,
  getNextStart,
  getPrevStart,
  getVisibleCount,
  hasCarousel,
} from "./chart-window";

describe("getVisibleCount", () => {
  it("PC 월별은 12개 전체, 일별은 PC 11·TAB 7·MO 3개씩 보인다", () => {
    expect(getVisibleCount("monthly", "desktop")).toBe(12);
    expect(getVisibleCount("daily", "desktop")).toBe(11);
    expect(getVisibleCount("monthly", "tablet")).toBe(7);
    expect(getVisibleCount("daily", "tablet")).toBe(7);
    expect(getVisibleCount("monthly", "mobile")).toBe(3);
    expect(getVisibleCount("daily", "mobile")).toBe(3);
  });
});

describe("hasCarousel", () => {
  it("항목이 다 보이면 캐러셀이 없다", () => {
    expect(hasCarousel(12, 12)).toBe(false);
    expect(hasCarousel(10, 11)).toBe(false);
    expect(hasCarousel(12, 7)).toBe(true);
  });
});

describe("getInitialStart", () => {
  it("이번 달이 보이는 마지막 칸에 오게 시작한다", () => {
    // 10월(인덱스 9)을 3개씩: 8~10월
    expect(getInitialStart(12, 3, 9)).toBe(7);
    // 10월까지만 있는 목 데이터(10개)를 7개씩: 4~10월
    expect(getInitialStart(10, 7, 9)).toBe(3);
  });

  it("초점이 앞쪽이면 0부터, 없으면 가장 최근 구간부터 시작한다", () => {
    expect(getInitialStart(12, 3, 1)).toBe(0);
    expect(getInitialStart(12, 3, null)).toBe(9);
  });

  it("항목이 구간보다 적으면 0이다", () => {
    expect(getInitialStart(5, 7, 4)).toBe(0);
  });
});

describe("이동", () => {
  it("←·→는 보이는 개수만큼 넘기고 양 끝에서 멈춘다", () => {
    expect(getNextStart(0, 3, 10)).toBe(3);
    expect(getNextStart(3, 3, 10)).toBe(6);
    // 마지막 구간은 꽉 차게 맞춤(9가 아니라 7)
    expect(getNextStart(6, 3, 10)).toBe(7);
    expect(getNextStart(7, 3, 10)).toBe(7);
    expect(getPrevStart(7, 3)).toBe(4);
    expect(getPrevStart(1, 3)).toBe(0);
  });

  it("양 끝에서는 해당 방향 버튼이 꺼진다", () => {
    expect(canGoPrev(0)).toBe(false);
    expect(canGoPrev(3)).toBe(true);
    expect(canGoNext(7, 3, 10)).toBe(false);
    expect(canGoNext(4, 3, 10)).toBe(true);
  });
});
