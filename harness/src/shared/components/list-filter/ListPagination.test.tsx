import { render, screen } from "@testing-library/react";

import { ListPagination } from "./ListPagination";

function renderPagination(totalCount: number) {
  render(
    <ListPagination
      page={1}
      totalPages={Math.ceil(totalCount / 10)}
      totalCount={totalCount}
      buildHref={(page) => `?page=${page}`}
      onChangePage={() => {}}
    />,
  );
}

describe("ListPagination", () => {
  it("결과가 0건이면 쪽 이동을 그리지 않는다", () => {
    renderPagination(0);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("결과가 있으면 쪽 이동을 그린다", () => {
    renderPagination(25);
    expect(
      screen.getByRole("navigation", { name: "페이지 이동" }),
    ).toBeInTheDocument();
  });
});
