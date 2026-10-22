import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDownUpIcon, ChevronDownIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

import type {
  Column,
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import type { ComponentProps, ReactNode } from "react";

// Figma 디자인 시스템 Data Table(2815:12670): Header Controls(필터 입력 + Columns) → Table → 선택 요약 + Previous/Next.
const SELECT_COLUMN_ID = "select";
const DEFAULT_PAGE_SIZE = 10;

type TableProps = ComponentProps<typeof Table>;

interface DataTableLabels {
  selectAll: string;
  selectRow: string;
  columns: string;
  previous: string;
  next: string;
  empty: ReactNode;
  selectionSummary: (selected: number, total: number) => ReactNode;
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  labels: DataTableLabels;
  getRowId?: (row: TData) => string;
  isSelectable?: boolean;
  /** 지정하면 이 컬럼을 거르는 입력창을 Header Controls에 둠. */
  filterColumnId?: string;
  filterPlaceholder?: string;
  pageSize?: number;
  size?: TableProps["size"];
  headerTone?: TableProps["headerTone"];
  className?: string;
}

function columnLabel<TData>(column: Column<TData>) {
  const { header } = column.columnDef;
  return typeof header === "string" ? header : column.id;
}

export function DataTable<TData>({
  columns,
  data,
  labels,
  getRowId,
  isSelectable = false,
  filterColumnId,
  filterPlaceholder,
  pageSize = DEFAULT_PAGE_SIZE,
  size,
  headerTone,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const selectColumn: ColumnDef<TData> = {
    id: SELECT_COLUMN_ID,
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => (
      <Checkbox
        aria-label={labels.selectAll}
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={labels.selectRow}
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  };

  const table = useReactTable({
    data,
    columns: isSelectable ? [selectColumn, ...columns] : columns,
    getRowId,
    enableRowSelection: isSelectable,
    initialState: { pagination: { pageSize } },
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const filterColumn = filterColumnId
    ? table.getColumn(filterColumnId)
    : undefined;
  const rows = table.getRowModel().rows;

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 pb-4">
        {filterColumn && (
          <Input
            inputSize="sm"
            className="max-w-96"
            placeholder={filterPlaceholder}
            aria-label={filterPlaceholder}
            value={String(filterColumn.getFilterValue() ?? "")}
            onChange={(event) =>
              filterColumn.setFilterValue(event.target.value)
            }
          />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              {labels.columns}
              <ChevronDownIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  onSelect={(event) => event.preventDefault()}
                >
                  {columnLabel(column)}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Table size={size} headerTone={headerTone}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <DataTableHead key={header.id} column={header.column}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </DataTableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={table.getVisibleLeafColumns().length}
                className="text-center text-muted-foreground"
              >
                {labels.empty}
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() ? "selected" : undefined}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between gap-2 pt-4">
        <p className="text-sm leading-6 text-muted-foreground">
          {isSelectable &&
            labels.selectionSummary(
              table.getFilteredSelectedRowModel().rows.length,
              table.getFilteredRowModel().rows.length,
            )}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {labels.previous}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {labels.next}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface DataTableHeadProps<TData> {
  column: Column<TData>;
  children: ReactNode;
}

// 정렬 가능한 컬럼은 Figma Header Type=Button(왼쪽 패딩 0, 상하 4 + 버튼), 체크박스 컬럼은 48 정사각.
function DataTableHead<TData>({ column, children }: DataTableHeadProps<TData>) {
  if (column.id === SELECT_COLUMN_ID) {
    return <TableHead className="w-12">{children}</TableHead>;
  }
  if (!column.getCanSort()) {
    return <TableHead>{children}</TableHead>;
  }
  const sorted = column.getIsSorted();
  const ariaSort = sorted === "asc" ? "ascending" : "descending";
  return (
    <TableHead className="py-1 pl-0" aria-sort={sorted ? ariaSort : "none"}>
      <Button
        variant="ghost-muted"
        className="hover:bg-transparent hover:text-primary"
        onClick={column.getToggleSortingHandler()}
      >
        {children}
        <ArrowDownUpIcon />
      </Button>
    </TableHead>
  );
}
