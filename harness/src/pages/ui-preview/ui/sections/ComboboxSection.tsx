import { CircleDashed } from "lucide-react";

import { Combobox } from "@/shared/components/combobox";

import { PreviewMatrix, previewStateProps } from "../PreviewMatrix";
import { Section } from "../Section";

const OPTIONS = [
  { value: "menu-01", label: "Menu Item 01" },
  { value: "menu-02", label: "Menu Item 02" },
];
// Figma Combobox(6777:61876) 표: 행 = 상태, 열 = 크기 × Default/Destructive
const ROWS = ["default", "hover", "focus", "filled", "disabled"] as const;
const COLUMNS = [
  "md · Default",
  "md · Destructive",
  "sm · Default",
  "sm · Destructive",
] as const;
const ERROR_TEXT = "Your one-time password must be 6 characters.";

export function ComboboxSection() {
  return (
    <Section title="Combobox (6777:61801)">
      <PreviewMatrix
        rows={ROWS}
        columns={COLUMNS}
        renderCell={(row, column) => (
          <Combobox
            className="w-96"
            size={column.startsWith("md") ? "md" : "sm"}
            options={OPTIONS}
            value={row === "filled" ? "menu-01" : undefined}
            icon={<CircleDashed />}
            label="Label"
            placeholder="Select..."
            searchPlaceholder="명령어 입력 또는 검색..."
            emptyText="결과 없음"
            helpText="Enter your email address"
            errorText={column.endsWith("Destructive") ? ERROR_TEXT : undefined}
            disabled={row === "disabled"}
            {...(row === "hover" || row === "focus"
              ? previewStateProps(row)
              : {})}
          />
        )}
      />
    </Section>
  );
}
