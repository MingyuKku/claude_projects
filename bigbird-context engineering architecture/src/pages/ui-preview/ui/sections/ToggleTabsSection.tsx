import { Bold } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Toggle } from "@/shared/ui/toggle";

import { PreviewMatrix, previewStateProps } from "../PreviewMatrix";
import { Section } from "../Section";

// Figma Toggle(6777:65077) 표: 행 = Pressed × 상태, 열 = 타입 × Outlined × 크기
const TOGGLE_ROWS = [
  "off · default",
  "off · hover",
  "off · focus",
  "off · disabled",
  "on · default",
  "on · focus",
] as const;
const TYPES = ["Default", "Text", "Icon"] as const;
const OUTLINES = [false, true] as const;
const SIZES = [
  ["sm", "sm"],
  ["md", "default"],
  ["lg", "lg"],
] as const;
const TOGGLE_COLUMNS = TYPES.flatMap((type) =>
  OUTLINES.flatMap((outlined) =>
    SIZES.map(
      ([name]) => `${type} · ${outlined ? "outline" : "plain"} · ${name}`,
    ),
  ),
);
const TAB_LABELS = ["tab-1", "tab-2", "tab-3", "tab-4", "tab-5"];

function ToggleCell({ row, column }: { row: string; column: string }) {
  const [type, outline, sizeName] = column.split(" · ");
  const [pressed, state] = row.split(" · ");
  const size = SIZES.find(([name]) => name === sizeName)?.[1];
  return (
    <Toggle
      aria-label={`${column} ${row}`}
      variant={outline === "outline" ? "outline" : "default"}
      size={size}
      pressed={pressed === "on"}
      disabled={state === "disabled"}
      {...(state === "hover" || state === "focus"
        ? previewStateProps(state)
        : {})}
    >
      {type !== "Text" && <Bold />}
      {type !== "Icon" && "Bold"}
    </Toggle>
  );
}

function TabsSample({
  variant,
  isStretched,
}: {
  variant: "default" | "line";
  isStretched: boolean;
}) {
  return (
    <Tabs
      defaultValue="tab-1"
      className={isStretched ? "w-[350px]" : undefined}
    >
      <TabsList
        variant={variant}
        className={isStretched ? "w-full" : undefined}
      >
        {TAB_LABELS.map((value) => (
          <TabsTrigger key={value} value={value}>
            Label
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export function ToggleTabsSection() {
  return (
    <>
      <Section title="Toggle (6777:65002)">
        <PreviewMatrix
          rows={TOGGLE_ROWS}
          columns={TOGGLE_COLUMNS}
          rowLabel={(row) => row}
          renderCell={(row, column) => <ToggleCell row={row} column={column} />}
        />
      </Section>

      <Section title="Tabs (4731:10911)">
        <PreviewMatrix
          rows={["Stretch Labels: False", "Stretch Labels: True"] as const}
          columns={["Default", "Line"] as const}
          rowLabel={(row) => row}
          renderCell={(row, column) => (
            <TabsSample
              variant={column === "Default" ? "default" : "line"}
              isStretched={row.endsWith("True")}
            />
          )}
        />
      </Section>
    </>
  );
}
