import { Fragment } from "react";

import type { ReactNode } from "react";

// Figma 컴포넌트 문서의 표(행 = 상태, 열 = 변형)와 같은 배치로 보여 주는 미리보기 전용 격자.
// 셀에 data-preview-state를 넘기면 index.css의 hover·focus 변형이 고정 적용됨.
export type PreviewState = "default" | "hover" | "focus" | "disabled";

export const previewStateProps = (state: PreviewState) =>
  state === "hover" || state === "focus" ? { "data-preview-state": state } : {};

interface PreviewMatrixProps<Row extends string, Column extends string> {
  rows: readonly Row[];
  columns: readonly Column[];
  rowLabel?: (row: Row) => string;
  columnLabel?: (column: Column) => string;
  renderCell: (row: Row, column: Column) => ReactNode;
}

export function PreviewMatrix<Row extends string, Column extends string>({
  rows,
  columns,
  rowLabel = (row) => `:${row}`,
  columnLabel = (column) => column,
  renderCell,
}: PreviewMatrixProps<Row, Column>) {
  return (
    <div
      className="grid items-center gap-x-6 gap-y-6"
      style={{
        gridTemplateColumns: `max-content repeat(${columns.length}, max-content)`,
      }}
    >
      <span />
      {columns.map((column) => (
        <span key={column} className="text-xs text-muted-foreground">
          {columnLabel(column)}
        </span>
      ))}
      {rows.map((row) => (
        <Fragment key={row}>
          <span className="text-xs text-muted-foreground">{rowLabel(row)}</span>
          {columns.map((column) => (
            <div key={column}>{renderCell(row, column)}</div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}
