import {
  ArrowDownUpIcon,
  BoldIcon,
  EllipsisIcon,
  ItalicIcon,
  UnderlineIcon,
} from "lucide-react";
import { Fragment } from "react";
import { toast } from "sonner";

import sampleThumbnail from "@/shared/assets/img/sample/thumbnail.jpg";
import { DataTable } from "@/shared/components/data-table";
import { ToastCard } from "@/shared/components/toast-card";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Toggle } from "@/shared/ui/toggle";

import { previewStateProps } from "../PreviewMatrix";
import { Section } from "../Section";

import type { PreviewState } from "../PreviewMatrix";
import type { ColumnDef } from "@tanstack/react-table";
import type { ComponentProps, ReactNode } from "react";

type TableSize = NonNullable<ComponentProps<typeof Table>["size"]>;
type HeaderTone = NonNullable<ComponentProps<typeof Table>["headerTone"]>;

interface Payment {
  id: string;
  status: string;
  email: string;
  amount: string;
}

// Figma Data Table(2815:12670) 예시 데이터
const PAYMENTS: Payment[] = [
  { id: "1", status: "Success", email: "ken99@yahoo.com", amount: "$316.00" },
  { id: "2", status: "Success", email: "abe45@gmail.com", amount: "$242.00" },
  {
    id: "3",
    status: "Processing",
    email: "monserrat44@gmail.com",
    amount: "$837.00",
  },
  { id: "4", status: "Success", email: "abe45@gmail.com", amount: "$874.00" },
  {
    id: "5",
    status: "Failed",
    email: "carmella@hotmail.com",
    amount: "$721.00",
  },
];

const PAYMENT_COLUMNS: ColumnDef<Payment>[] = [
  { accessorKey: "status", header: "Header", enableSorting: false },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "amount", header: "Amount", enableSorting: false },
  {
    id: "actions",
    enableSorting: false,
    enableHiding: false,
    cell: () => (
      <Button variant="ghost-foreground" size="icon-sm" aria-label="More">
        <EllipsisIcon />
      </Button>
    ),
  },
];

const TABLE_LABELS = {
  selectAll: "Select all",
  selectRow: "Select row",
  columns: "Columns",
  previous: "Previous",
  next: "Next",
  empty: "No results.",
  selectionSummary: (selected: number, total: number) =>
    `${selected} of ${total} row(s) selected.`,
};

const SIZES = ["xs", "sm", "md", "lg"] as const satisfies readonly TableSize[];
const HOVER_STATES = [
  "default",
  "hover",
] as const satisfies readonly PreviewState[];

const CELL_TEXT = "Cell Contents";
const CELL_DESCRIPTION = "Description";
const HEADER_TEXT = "Header";

// 단독 셀 미리보기: 표 바깥 테두리를 빼고 Figma처럼 아래 구분선만 남김.
const BARE_TABLE =
  "[&_[data-slot=table-container]]:rounded-none [&_[data-slot=table-container]]:border-0 [&_tr]:border-b!";

// Figma Table Base / Cell(2770:31005) 행 순서·라벨
const LEFT_CELL_TYPES = [
  "Checkbox",
  "Text",
  "Text-Bold",
  "Text + Description",
  "Avatar",
  "Avatar + Description",
  "Badge",
  "Image",
  "Image + Description",
  "Input",
  "Button",
  "Toggle",
  "Switch",
  "3-dot menu",
  "Footer",
] as const;
const RIGHT_CELL_TYPES = [
  "Text",
  "Text-Bold",
  "Switch",
  "Footer",
] as const satisfies readonly CellType[];
type CellType = (typeof LEFT_CELL_TYPES)[number];

// Figma 셀 폭: Start. Checkbox 48 / End. 3-dot Menu 64 / 그 외 200
const CELL_WIDTH: Partial<Record<CellType, string>> = {
  Checkbox: "w-12",
  "3-dot menu": "w-16",
};

interface MatrixColumn {
  key: string;
  group: string;
  label: string;
}

interface MatrixRowGroup<Row extends string> {
  label: string;
  rows: readonly Row[];
}

// Figma 문서처럼 열 위에 상태 묶음(:default/:hover), 행 앞에 Left/Right 묶음 라벨을 둔 격자
function GroupedMatrix<Row extends string, Column extends MatrixColumn>({
  columns,
  groups,
  renderCell,
}: {
  columns: readonly Column[];
  groups: readonly MatrixRowGroup<Row>[];
  renderCell: (row: Row, column: Column, group: string) => ReactNode;
}) {
  const columnGroups = columns.filter(
    (column, index) => columns[index - 1]?.group !== column.group,
  );
  return (
    <div
      className="grid items-center gap-x-6 gap-y-4"
      style={{
        gridTemplateColumns: `max-content repeat(${columns.length}, max-content)`,
      }}
    >
      <span />
      {columnGroups.map((column) => (
        <span
          key={column.group}
          className="text-xs font-medium text-muted-foreground"
          style={{
            gridColumn: `span ${columns.filter((c) => c.group === column.group).length}`,
          }}
        >
          {column.group}
        </span>
      ))}
      <span />
      {columns.map((column) => (
        <span key={column.key} className="text-xs text-muted-foreground">
          {column.label}
        </span>
      ))}
      {groups.map((group) =>
        group.rows.map((row, index) => (
          <Fragment key={`${group.label}-${row}`}>
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              {index === 0 && (
                <span className="font-medium text-foreground">
                  {group.label}
                </span>
              )}
              <span>{row}</span>
            </div>
            {columns.map((column) => (
              <div key={column.key}>{renderCell(row, column, group.label)}</div>
            ))}
          </Fragment>
        )),
      )}
    </div>
  );
}

function CellTextBlock({ isCompact }: { isCompact: boolean }) {
  return (
    <div
      className={cn("flex min-w-0 flex-col", isCompact ? "gap-0.5" : "gap-1")}
    >
      <span className="truncate leading-none font-medium">{CELL_TEXT}</span>
      <span
        className={cn(
          "truncate text-muted-foreground",
          isCompact ? "text-xs leading-4" : "leading-5",
        )}
      >
        {CELL_DESCRIPTION}
      </span>
    </div>
  );
}

function CellThumbnail({ isCompact }: { isCompact: boolean }) {
  return (
    <img
      src={sampleThumbnail}
      alt=""
      className={cn(
        "shrink-0 rounded-md border border-border object-cover",
        isCompact ? "size-8" : "size-10",
      )}
    />
  );
}

function CellAvatar({ isCompact }: { isCompact: boolean }) {
  return (
    <Avatar size={isCompact ? "sm" : "md"}>
      <AvatarPlaceholder />
    </Avatar>
  );
}

// Figma: xs는 내부 요소를 한 단계 작게(Avatar·Image 32, Badge sm, Button xs, Toggle sm, 설명 12px)
function CellContent({ type, size }: { type: CellType; size: TableSize }) {
  const isCompact = size === "xs";
  switch (type) {
    case "Checkbox":
      return <Checkbox aria-label="Select row" />;
    case "Text":
    case "Text-Bold":
    case "Footer":
      return CELL_TEXT;
    case "Text + Description":
      return <CellTextBlock isCompact={isCompact} />;
    case "Avatar":
      return (
        <div className="flex items-center gap-3">
          <CellAvatar isCompact={isCompact} />
          {CELL_TEXT}
        </div>
      );
    case "Avatar + Description":
      return (
        <div className="flex items-center gap-3">
          <CellAvatar isCompact={isCompact} />
          <CellTextBlock isCompact={isCompact} />
        </div>
      );
    case "Badge":
      return <Badge size={isCompact ? "sm" : "md"}>Badge</Badge>;
    case "Image":
      return <CellThumbnail isCompact={isCompact} />;
    case "Image + Description":
      return (
        <div className="flex items-center gap-3">
          <CellThumbnail isCompact={isCompact} />
          <CellTextBlock isCompact={isCompact} />
        </div>
      );
    case "Input":
      return <Input placeholder="Placeholder" aria-label="Placeholder" />;
    case "Button":
      return (
        <Button variant="outline" size={isCompact ? "xs" : "default"}>
          Button
        </Button>
      );
    case "Toggle": {
      const toggleSize = isCompact ? "sm" : "default";
      return (
        <div className="flex gap-1">
          <Toggle variant="outline" size={toggleSize} aria-label="Bold">
            <BoldIcon />
          </Toggle>
          <Toggle variant="outline" size={toggleSize} aria-label="Italic">
            <ItalicIcon />
          </Toggle>
          <Toggle variant="outline" size={toggleSize} aria-label="Underline">
            <UnderlineIcon />
          </Toggle>
        </div>
      );
    }
    case "Switch":
      return <Switch size="sm" aria-label="Switch" />;
    case "3-dot menu":
      return (
        <Button variant="ghost-foreground" size="icon-sm" aria-label="More">
          <EllipsisIcon />
        </Button>
      );
  }
}

function CellPreview({
  type,
  size,
  state,
  isRight,
}: {
  type: CellType;
  size: TableSize;
  state: PreviewState;
  isRight: boolean;
}) {
  const Group = type === "Footer" ? TableFooter : TableBody;
  return (
    <div className={BARE_TABLE}>
      <Table size={size} className="w-auto">
        <Group>
          <TableRow {...previewStateProps(state)}>
            <TableCell
              className={cn(
                CELL_WIDTH[type] ?? "w-50",
                type === "Text-Bold" && "font-medium",
                isRight && "text-right",
              )}
            >
              <CellContent type={type} size={size} />
            </TableCell>
          </TableRow>
        </Group>
      </Table>
    </div>
  );
}

const CELL_COLUMNS = HOVER_STATES.flatMap((state) =>
  SIZES.map((size) => ({
    key: `${state}-${size}`,
    group: `:${state}`,
    label: `Size: ${size}`,
    state,
    size,
  })),
);

const CELL_GROUPS: MatrixRowGroup<CellType>[] = [
  { label: "Left", rows: LEFT_CELL_TYPES },
  { label: "Right", rows: RIGHT_CELL_TYPES },
];

// Figma Table Base / Header(2768:27447) · Header Gray(6901:48769)
const HEADER_TYPES = ["Header", "Button", "Checkbox"] as const;
type HeaderType = (typeof HEADER_TYPES)[number];

const HEADER_GROUPS: MatrixRowGroup<HeaderType>[] = [
  { label: "Left", rows: HEADER_TYPES },
  { label: "Right", rows: ["Header", "Button"] },
];

const TONE_OF: Record<"Header" | "Header Gray", HeaderTone> = {
  Header: "default",
  "Header Gray": "gray",
};

const HEADER_COLUMNS = (["Header", "Header Gray"] as const).flatMap((tone) =>
  HOVER_STATES.map((state) => ({
    key: `${tone}-${state}`,
    group: tone,
    label: `:${state}`,
    tone: TONE_OF[tone],
    state,
  })),
);

function HeaderContent({
  type,
  tone,
  state,
}: {
  type: HeaderType;
  tone: HeaderTone;
  state: PreviewState;
}) {
  if (type === "Checkbox") return <Checkbox aria-label="Select all" />;
  if (type === "Header") return HEADER_TEXT;
  // Figma: 기본 헤더는 hover 시 버튼 글자가 primary, Gray 헤더는 muted 유지
  return (
    <Button
      variant="ghost-muted"
      className={cn(
        "hover:bg-transparent",
        tone === "default" && "hover:text-primary",
      )}
      {...previewStateProps(state)}
    >
      Button
      <ArrowDownUpIcon />
    </Button>
  );
}

function HeaderPreview({
  type,
  tone,
  state,
  isRight,
}: {
  type: HeaderType;
  tone: HeaderTone;
  state: PreviewState;
  isRight: boolean;
}) {
  return (
    <div className={BARE_TABLE}>
      <Table headerTone={tone} className="w-auto">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead
              className={cn(
                type === "Checkbox" ? "w-12" : "w-36",
                type === "Button" && "py-1",
                type === "Button" && !isRight && "pl-0",
                isRight && "text-right",
              )}
              {...previewStateProps(state)}
            >
              <HeaderContent type={type} tone={tone} state={state} />
            </TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    </div>
  );
}

// Figma Toast(6706:10632) Example 행
const TOAST_EXAMPLES = [
  {
    label: "Default",
    title: "Scheduled: Catch up",
    description: "Friday, February 10, 2023 at 5:57 PM",
    actionLabel: "Undo",
  },
  { label: "Simple", description: "Your message has been sent." },
  {
    label: "With title",
    title: "Uh oh! Something went wrong.",
    description: "There was a problem with your request.",
  },
  {
    label: "With Action",
    title: "Uh oh! Something went wrong.",
    description: "There was a problem with your request.",
    actionLabel: "Undo",
  },
  {
    label: "Destructive",
    title: "Uh oh! Something went wrong.",
    description: "There was a problem with your request.",
    actionLabel: "Try again",
    isDestructive: true,
  },
];

type ToastExample = (typeof TOAST_EXAMPLES)[number];

function showToast({
  title,
  description,
  actionLabel,
  isDestructive,
}: ToastExample) {
  const action = actionLabel
    ? { label: actionLabel, onClick: () => {} }
    : undefined;
  const show = isDestructive ? toast.error : toast;
  show(title ?? "", { description, action });
}

export function DataSection() {
  return (
    <>
      <Section title="Data Table (4732:24967)">
        <DataTable
          className="w-175"
          columns={PAYMENT_COLUMNS}
          data={PAYMENTS}
          labels={TABLE_LABELS}
          getRowId={(row) => row.id}
          isSelectable
          filterColumnId="email"
          filterPlaceholder="Email"
        />
        <DataTable
          className="w-175"
          columns={PAYMENT_COLUMNS}
          data={[]}
          labels={TABLE_LABELS}
          headerTone="gray"
          size="xs"
          isSelectable
        />
      </Section>
      <Section title="Data Table — Table Base / Cell (2770:31005)">
        <GroupedMatrix
          columns={CELL_COLUMNS}
          groups={CELL_GROUPS}
          renderCell={(type, column, group) => {
            const { size, state } = column;
            return (
              <CellPreview
                type={type}
                size={size}
                state={state}
                isRight={group === "Right"}
              />
            );
          }}
        />
      </Section>
      <Section title="Data Table — Table Base / Header (2768:27447) · Header Gray (6901:48769)">
        <GroupedMatrix
          columns={HEADER_COLUMNS}
          groups={HEADER_GROUPS}
          renderCell={(type, column, group) => {
            const { tone, state } = column;
            // Header Gray에는 Right 변형이 없음.
            if (tone === "gray" && group === "Right") return null;
            return (
              <HeaderPreview
                type={type}
                tone={tone}
                state={state}
                isRight={group === "Right"}
              />
            );
          }}
        />
      </Section>
      <Section title="Toast (6706:10632)">
        <div className="flex flex-wrap items-start gap-6">
          {TOAST_EXAMPLES.map((example) => (
            <div
              key={example.label}
              className="flex flex-col items-center gap-3"
            >
              <ToastCard
                title={example.title}
                description={example.description}
                actionLabel={example.actionLabel}
                isDestructive={example.isDestructive}
              />
              <span className="text-xs text-muted-foreground">
                {example.label}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => showToast(example)}
              >
                Show
              </Button>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
