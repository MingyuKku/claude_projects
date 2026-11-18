import {
  applyFilterValues,
  hasActiveFilter,
  isSameFilterValues,
  readFilterValues,
} from "./filter-values";

import type { FilterField } from "./filter-fields";

const FIELDS: FilterField[] = [
  { type: "date", id: "date", label: "충전 일자", placeholder: "날짜" },
  {
    type: "select",
    id: "status",
    label: "입금 상태",
    placeholder: "상태",
    options: [
      { value: "결제완료", label: "결제 완료" },
      { value: "대기중", label: "대기 중" },
    ],
  },
];

describe("readFilterValues", () => {
  it("올바른 날짜 범위와 선택지의 값을 읽는다", () => {
    const params = new URLSearchParams(
      "dateFrom=2026-10-01&dateTo=2026-10-23&status=대기중",
    );
    expect(readFilterValues(params, FIELDS)).toEqual({
      dateFrom: "2026-10-01",
      dateTo: "2026-10-23",
      status: "대기중",
    });
  });

  it("시작일만 있거나 날짜 형식이 틀리면 날짜는 버린다", () => {
    expect(
      readFilterValues(new URLSearchParams("dateFrom=2026-10-01"), FIELDS),
    ).toEqual({});
    expect(
      readFilterValues(
        new URLSearchParams("dateFrom=2026-13-01&dateTo=2026-10-23"),
        FIELDS,
      ),
    ).toEqual({});
  });

  it("선택지에 없는 값은 버린다", () => {
    expect(
      readFilterValues(new URLSearchParams("status=환불"), FIELDS),
    ).toEqual({});
  });
});

describe("readFilterValues의 비활성 필드", () => {
  it("비활성 필드는 주소에 값이 있어도 읽지 않는다", () => {
    const disabled = FIELDS.map((field) => ({ ...field, isDisabled: true }));
    const params = new URLSearchParams(
      "dateFrom=2026-10-01&dateTo=2026-10-23&status=대기중",
    );
    expect(readFilterValues(params, disabled)).toEqual({});
  });
});

describe("hasActiveFilter·isSameFilterValues", () => {
  it("값이 하나라도 있으면 필터가 걸린 것이다", () => {
    expect(hasActiveFilter({})).toBe(false);
    expect(hasActiveFilter({ status: "대기중" })).toBe(true);
  });

  it("키 순서와 상관없이 같은 값이면 같다", () => {
    expect(
      isSameFilterValues(
        { dateFrom: "a", status: "b" },
        { status: "b", dateFrom: "a" },
      ),
    ).toBe(true);
    expect(isSameFilterValues({ status: "b" }, {})).toBe(false);
  });
});

describe("applyFilterValues", () => {
  it("이 필드들의 쿼리만 바꾸고 다른 쿼리는 두며 쪽을 처음으로 돌린다", () => {
    const params = new URLSearchParams(
      "tab=charge&page=3&status=대기중&dateFrom=2026-10-01&dateTo=2026-10-02",
    );
    applyFilterValues(params, FIELDS, { status: "결제완료" }, "page");
    expect(params.toString()).toBe(
      new URLSearchParams("tab=charge&status=결제완료").toString(),
    );
  });
});
