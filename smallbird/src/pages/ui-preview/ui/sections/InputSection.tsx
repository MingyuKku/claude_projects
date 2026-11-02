import { FormField, PasswordInput } from "@/shared/components/form-field";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import { PreviewMatrix, previewStateProps } from "../PreviewMatrix";
import { Section } from "../Section";

// Figma Input(6918:60706) 표: 행 = 상태, 열 = 크기 × Text/File × Default/Destructive
const ROWS = [
  "default",
  "focus-empty",
  "focus-filled",
  "filled",
  "disabled",
] as const;
const COLUMNS = [
  "Text · Default",
  "Text · Destructive",
  "File · Default",
  "File · Destructive",
] as const;
const SIZES = ["md", "sm"] as const;
const ORIENTATIONS = ["vertical", "horizontal"] as const;
const ERROR_TEXT = "Your one-time password must be 6 characters.";

type Row = (typeof ROWS)[number];
type Column = (typeof COLUMNS)[number];

interface CellProps {
  row: Row;
  column: Column;
  size: (typeof SIZES)[number];
  orientation: (typeof ORIENTATIONS)[number];
}

function InputCell({ row, column, size, orientation }: CellProps) {
  const isFile = column.startsWith("File");
  const isInvalid = column.endsWith("Destructive");
  const isVertical = orientation === "vertical";
  const disabled = row === "disabled";
  const isFilled = row === "focus-filled" || row === "filled";
  const isFocused = row === "focus-empty" || row === "focus-filled";

  return (
    <FormField
      className="w-96"
      label="Label"
      orientation={orientation}
      helpText={isVertical ? "Enter your email address" : undefined}
      errorText={isInvalid && isVertical ? ERROR_TEXT : undefined}
      disabled={disabled}
    >
      {(control) => (
        <div className="flex items-center gap-2">
          <Input
            {...control}
            {...(isFocused ? previewStateProps("focus") : {})}
            aria-invalid={isInvalid || undefined}
            inputSize={size}
            type={isFile ? "file" : "text"}
            placeholder="Email"
            defaultValue={!isFile && isFilled ? "Email" : undefined}
          />
          <Button size={size === "md" ? "default" : "sm"} disabled={disabled}>
            {isFile ? "Submit" : "Subscribe"}
          </Button>
        </div>
      )}
    </FormField>
  );
}

export function InputSection() {
  return (
    <>
      {SIZES.map((size) =>
        ORIENTATIONS.map((orientation) => (
          <Section
            key={`${size}-${orientation}`}
            title={`Input · ${size} · ${orientation === "vertical" ? "Vertical" : "Horizontal"} (6918:60663)`}
          >
            <PreviewMatrix
              rows={ROWS}
              columns={COLUMNS}
              renderCell={(row, column) => (
                <InputCell
                  row={row}
                  column={column}
                  size={size}
                  orientation={orientation}
                />
              )}
            />
          </Section>
        )),
      )}

      <Section title="Input · 필수(*) · 카운터 · 비밀번호(eye)">
        <FormField
          className="w-96"
          label="Label"
          isRequired
          counter="0/100"
          helpText="Enter your email address"
        >
          {(control) => (
            <Input {...control} placeholder="Email" maxLength={100} />
          )}
        </FormField>
        <FormField className="w-96" label="비밀번호" isRequired>
          {(control) => (
            <PasswordInput
              {...control}
              placeholder="비밀번호"
              showLabel="비밀번호 보기"
              hideLabel="비밀번호 숨기기"
            />
          )}
        </FormField>
      </Section>
    </>
  );
}
