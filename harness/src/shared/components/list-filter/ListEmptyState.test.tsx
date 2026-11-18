import { render, screen } from "@testing-library/react";

import { ListEmptyState } from "./ListEmptyState";

describe("ListEmptyState", () => {
  it("0건이면 탭의 제목만 보인다", () => {
    render(
      <ListEmptyState
        kind="none"
        keyword=""
        noneTitle="빅버드 머니 충전 내역이 없습니다."
      />,
    );
    expect(
      screen.getByText("빅버드 머니 충전 내역이 없습니다."),
    ).toBeInTheDocument();
  });

  it("검색어만 있으면 설명 없이 검색 결과 없음 문구를 보인다", () => {
    render(<ListEmptyState kind="search" keyword="여름" noneTitle="없음" />);
    expect(
      screen.getByText("‘여름’에 대한 결과가 없습니다."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/필터를 변경하거나/)).not.toBeInTheDocument();
  });

  it("필터만 있으면 조건 문구와 안내 설명을 보인다", () => {
    render(<ListEmptyState kind="filter" keyword="" noneTitle="없음" />);
    expect(
      screen.getByText("선택한 조건에 맞는 결과가 없습니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("필터를 변경하거나 초기화해 보세요."),
    ).toBeInTheDocument();
  });

  it("검색어와 필터가 함께면 둘을 모두 말한다", () => {
    render(
      <ListEmptyState kind="searchFilter" keyword="여름" noneTitle="없음" />,
    );
    expect(
      screen.getByText("‘여름’ 검색어와 선택한 조건에 맞는 결과가 없습니다."),
    ).toBeInTheDocument();
  });
});
