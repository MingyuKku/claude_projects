import { FormField } from "@/shared/components/form-field";
import { SearchInput } from "@/shared/components/search-input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import { PreviewMatrix, previewStateProps } from "../PreviewMatrix";
import { Section } from "../Section";

const FRUITS = ["Apple", "Banana", "Blueberry", "Grapes", "Pineapple"];
const ERROR_TEXT = "Your one-time password must be 6 characters.";
// Figma Select(2738:3406) 표
const SELECT_ROWS = ["default", "focus", "filled", "disabled"] as const;
const SELECT_COLUMNS = [
  "md · Default",
  "md · Destructive",
  "sm · Default",
  "sm · Destructive",
] as const;
// Figma Search(2752:9357) 표
const SEARCH_ROWS = [
  "default",
  "focus-empty",
  "focus-filled",
  "disabled",
] as const;
const SEARCH_COLUMNS = ["Line", "Filled"] as const;
const SEARCH_PLACEHOLDER = "명령어 입력 또는 검색...";

function SelectCell({
  row,
  column,
}: {
  row: (typeof SELECT_ROWS)[number];
  column: (typeof SELECT_COLUMNS)[number];
}) {
  const disabled = row === "disabled";
  return (
    <FormField
      className="w-96"
      label="Label"
      helpText="Enter your email address"
      errorText={column.endsWith("Destructive") ? ERROR_TEXT : undefined}
      disabled={disabled}
    >
      {(control) => (
        <Select
          disabled={disabled}
          defaultValue={row === "filled" ? "Apple" : undefined}
        >
          <SelectTrigger
            {...control}
            {...(row === "focus" ? previewStateProps("focus") : {})}
            size={column.startsWith("md") ? "default" : "sm"}
          >
            <SelectValue placeholder="선택..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              {FRUITS.map((fruit) => (
                <SelectItem key={fruit} value={fruit}>
                  {fruit}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
    </FormField>
  );
}

export function SelectSection() {
  return (
    <>
      <Section title="Select (4733:7729)">
        <PreviewMatrix
          rows={SELECT_ROWS}
          columns={SELECT_COLUMNS}
          renderCell={(row, column) => <SelectCell row={row} column={column} />}
        />
      </Section>

      <Section title="Search (6706:15489)">
        <PreviewMatrix
          rows={SEARCH_ROWS}
          columns={SEARCH_COLUMNS}
          renderCell={(row, column) => (
            <SearchInput
              className="w-[300px]"
              variant={column === "Line" ? "line" : "filled"}
              placeholder={SEARCH_PLACEHOLDER}
              defaultValue={
                row === "focus-filled" ? SEARCH_PLACEHOLDER : undefined
              }
              disabled={row === "disabled"}
            />
          )}
        />
      </Section>
    </>
  );
}
