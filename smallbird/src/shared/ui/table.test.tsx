import { fireEvent, render, screen } from "@testing-library/react";

import { Table, TableBody, TableCell, TableRow } from "./table";

function renderTable(props: { isFirstColumnSticky?: boolean } = {}) {
  render(
    <Table aria-label="표" {...props}>
      <TableBody>
        <TableRow>
          <TableCell>첫 열</TableCell>
          <TableCell>둘째 열</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
  const table = screen.getByRole("table", { name: "표" });
  return { table, container: table.parentElement! };
}

function scrollTo(container: HTMLElement, left: number) {
  container.scrollLeft = left;
  fireEvent.scroll(container);
}

describe("Table", () => {
  it("기본으로 첫 열을 고정한다", () => {
    expect(renderTable().table).toHaveAttribute(
      "data-first-column-sticky",
      "true",
    );
  });

  it("끄면 첫 열을 고정하지 않는다", () => {
    expect(
      renderTable({ isFirstColumnSticky: false }).table,
    ).toHaveAttribute("data-first-column-sticky", "false");
  });

  it("가로로 스크롤한 동안만 스크롤됨으로 표시한다(첫 열 그림자)", () => {
    const { table, container } = renderTable();
    expect(table).toHaveAttribute("data-scrolled", "false");

    scrollTo(container, 40);
    expect(table).toHaveAttribute("data-scrolled", "true");

    scrollTo(container, 0);
    expect(table).toHaveAttribute("data-scrolled", "false");
  });

  it("여러 열을 가로지르는 칸(빈 상태)은 고정 첫 열 스타일을 받지 않는다", () => {
    render(
      <Table aria-label="빈 표">
        <TableBody>
          <TableRow>
            <TableCell colSpan={3}>비어 있음</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>첫 열</TableCell>
            <TableCell>둘째 열</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByText("비어 있음").className).not.toMatch(/sticky/);
    expect(screen.getByText("첫 열").className).toMatch(/sticky/);
  });
});
